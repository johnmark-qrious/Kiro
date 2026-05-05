---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# C# Conventions for Ubiquity Backend

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Public property/method | PascalCase | `GetAccountById` |
| Private field | `_camelCase` | `_accountService` |
| Local variable | camelCase | `accountId` |
| Interface | `I` prefix | `IAccountService` |
| Async method | `Async` suffix | `LoadDataAsync` |
| Constants | PascalCase | `MaxRetryCount` |
| Enum values | PascalCase | `AccountStatus.Active` |
| DTO/model classes | `Info` suffix | `FieldUsageInfo`, `AccountInfo` |

## Async/Await

```csharp
// ✅ Good: async all the way
public async Task<Account> GetAccountAsync(int id)
{
    var account = await _repository.FindAsync(id);
    if (account is null)
        throw new NotFoundException($"Account {id} not found");
    return account;
}

// ❌ Bad: blocking on async
public Account GetAccount(int id)
{
    return _repository.FindAsync(id).Result; // deadlock risk
}
```

## Dependency Injection

```csharp
// ✅ Good: constructor injection with readonly fields
public sealed class AccountService : IAccountService
{
    private readonly IAccountRepository _repository;
    private readonly ILogger _logger;

    public AccountService(IAccountRepository repository, ILogger logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
}
```

## Error Handling

```csharp
// ✅ Good: specific catch, structured logging
try
{
    await _service.ProcessAsync(request);
}
catch (InvalidOperationException ex) when (ex.Message.Contains("duplicate"))
{
    _logger.LogWarning(ex, "Duplicate entry for request {RequestId}", request.Id);
    throw new ConflictException("Entry already exists", ex);
}

// ❌ Bad: swallowing exceptions
try { await _service.ProcessAsync(request); }
catch { /* ignore */ }
```

## Guard Clauses

```csharp
public void UpdateAccount(Account account)
{
    ArgumentNullException.ThrowIfNull(account);
    if (string.IsNullOrWhiteSpace(account.Name))
        throw new ArgumentException("Account name is required", nameof(account));
    // ... logic
}
```

## LINQ

```csharp
// ✅ Good: readable, materialized
var activeAccounts = accounts
    .Where(a => a.Status == AccountStatus.Active)
    .OrderBy(a => a.Name)
    .ToList();

// ❌ Bad: multiple enumeration
var filtered = accounts.Where(a => a.IsActive);
var count = filtered.Count();     // enumerates once
var first = filtered.First();     // enumerates again
```

## File Structure

- **One class per file** — standard C# convention. No multiple public classes in a single file.
- Private nested classes (e.g., internal API response models) are fine within the containing class.

## Don't Do This

- **Don't use `Dto` suffix**  this codebase uses `Info` suffix for data transfer objects (e.g., `FieldUsageInfo`, `AccountInfo`, `SchemaInfo`). Never `FieldUsageDto`.
- **Don't put multiple public classes in one file**  even if they're small/related. One class = one file. Private nested classes inside a parent class are the exception.

- **Don't use `.Result` on async calls** — use `async/await` throughout. `.Result` causes deadlocks in ASP.NET and was flagged in PR review. The interface should return `Task<T>` and the method should be `async`.
## XML Configuration

The backend uses XML config files (`settings.xml`, `interfaces.xml`) for service wiring. When modifying:
- Check existing entries for the pattern
- Maintain alphabetical ordering where the file follows it
- Test that the service host loads correctly after changes

## NUnit Testing

```csharp
[TestFixture]
public sealed class AccountServiceTests
{
    private IAccountService _sut;
    private Mock<IAccountRepository> _repository;

    [SetUp]
    public void SetUp()
    {
        _repository = new Mock<IAccountRepository>();
        _sut = new AccountService(_repository.Object);
    }

    [Test]
    public async Task GetAccountAsync_WhenExists_ReturnsAccount()
    {
        // Arrange
        var expected = new Account { Id = 1, Name = "Test" };
        _repository.Setup(r => r.FindAsync(1)).ReturnsAsync(expected);

        // Act
        var result = await _sut.GetAccountAsync(1);

        // Assert
        Assert.That(result, Is.EqualTo(expected));
    }

    [Test]
    public void GetAccountAsync_WhenNotFound_ThrowsNotFoundException()
    {
        _repository.Setup(r => r.FindAsync(It.IsAny<int>())).ReturnsAsync((Account)null);

        Assert.ThrowsAsync<NotFoundException>(() => _sut.GetAccountAsync(999));
    }
}
```
