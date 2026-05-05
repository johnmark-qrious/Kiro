---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# SOLID Principles — Ubiquity Backend

The Ubiquity Backend follows SOLID principles throughout. This guide documents how each principle is applied in this codebase so new code stays consistent.

## S — Single Responsibility Principle

Each class has one reason to change. The codebase enforces this through the Command/Handler pattern.

```csharp
// ✅ Good: One command, one handler, one responsibility
public class ActivateWebhook : AsyncCommandHandler<ActivateWebhookCommand, ActivateWebhookResult>
{
    private readonly ITransaction _transaction;
    private readonly IWebhookActivationHandler _activationHandler;

    // This class ONLY handles webhook activation — nothing else
}

// ❌ Bad: God class that does everything
public class WebhookService
{
    public void Activate(...) { }
    public void Deactivate(...) { }
    public void Delete(...) { }
    public void Update(...) { }
    public void GetInvocations(...) { }
    // Too many responsibilities
}
```

**Pattern in this repo**: Each operation is a separate `CommandHandler<TCommand, TResult>` or `AsyncCommandHandler<TCommand, TResult>` class.

## O — Open/Closed Principle

Classes are open for extension, closed for modification. The base `CommandHandler<T>` and `AsyncCommandHandler<T>` classes provide extension points without requiring changes to the base.

```csharp
// ✅ Good: Extend via new handler, don't modify existing ones
public class DeactivateWebhook : AsyncCommandHandler<DeactivateWebhookCommand, ActivateWebhookResult>
{
    // New behavior added by creating a new class, not modifying ActivateWebhook
}

// ✅ Good: New encoder without modifying existing ones
public class JsonValueEncoder : IValueEncoder { }
public class XmlValueEncoder : IValueEncoder { }
public class DefaultValueEncoder : IValueEncoder { }
```

**Pattern in this repo**: New functionality = new class implementing an existing interface or extending a base class.

## L — Liskov Substitution Principle

Subtypes are substitutable for their base types. Interface implementations honor the contract.

```csharp
// ✅ Good: Any IValueEncoder works wherever IValueEncoder is expected
public class SwapoutContentTransformParser
{
    private readonly IValueEncoder _valueEncoder;

    // Works with JsonValueEncoder, XmlValueEncoder, DefaultValueEncoder — all interchangeable
    public SwapoutContentTransformParser(IValueEncoder valueEncoder)
    {
        _valueEncoder = valueEncoder;
    }
}
```

**Pattern in this repo**: Constructor injection with interfaces — the caller doesn't know or care which implementation is provided.

## I — Interface Segregation Principle

Clients depend only on the interfaces they use. The codebase uses granular, focused interfaces.

```csharp
// ✅ Good: Separate interfaces for separate concerns
public interface IWebhookManager { }        // CRUD operations
public interface IWebhookDataManager { }    // Data/invocation queries
public interface IRemoteCacheManager { }    // Cache operations
public interface IAccountIdResolver { }     // ID resolution only

// ❌ Bad: One fat interface for everything
public interface IWebhookEverything
{
    void CreateWebhook(...);
    void DeleteWebhook(...);
    List<Invocation> GetInvocations(...);
    void ClearCache(...);
    Guid ResolveAccountId(...);
}
```

**Pattern in this repo**: Small, focused interfaces in `{domain}/common/Interfaces/`. Each interface covers one cohesive set of operations.

## D — Dependency Inversion Principle

High-level modules depend on abstractions, not concrete implementations. Constructor injection is used everywhere.

```csharp
// ✅ Good: Depends on abstractions
public class WebhookActivationHandler : IWebhookActivationHandler
{
    private readonly IWebhooksData _dataStore;
    private readonly IWebhooksMetaData _metaDataStore;
    private readonly IEngageApi _engageApi;
    private readonly IWebhooksCloudApi _cloudApi;
    private readonly IEventPublisher _eventPublisher;

    public WebhookActivationHandler(
        IWebhooksData dataStore,
        IWebhooksMetaData metaDataStore,
        IEngageApi engageApi,
        IWebhooksCloudApi cloudApi,
        IEventPublisher eventPublisher)
    {
        _dataStore = dataStore;
        _metaDataStore = metaDataStore;
        _engageApi = engageApi;
        _cloudApi = cloudApi;
        _eventPublisher = eventPublisher;
    }
}

// ❌ Bad: Depends on concrete implementations
public class WebhookActivationHandler
{
    private readonly SqlWebhooksData _dataStore = new SqlWebhooksData();
    // Tightly coupled, untestable
}
```

**Pattern in this repo**: All dependencies are injected via constructor. XML config files (`interfaces.xml`) wire up the concrete implementations.

## Enforcement Rules

When writing new code in this repo:

1. **New operation?** → Create a new `CommandHandler` class, don't add methods to existing services
2. **New capability?** → Define an interface first, then implement it
3. **Need a dependency?** → Inject it via constructor, never `new` it up inside the class
4. **Interface getting big?** → Split it into focused interfaces
5. **Modifying a base class?** → Consider if you should extend instead
6. **Adding tests?** → Mock the interfaces, not the concrete classes
