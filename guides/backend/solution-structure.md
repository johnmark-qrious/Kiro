---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Ubiquity Backend Solution Structure

## Repository: QT-Ubi-UbiquityBackend

Solution file: `u3.sln` — .NET 8 (SDK 8.0.121)

## Domain Layout

Each service domain follows a consistent project structure:

```
{domain}/
├── common/          # Shared types, interfaces, DTOs for this domain
├── core/            # Business logic, service implementations
├── content/         # Static content, templates
├── nunit/           # NUnit test project
├── settings.xml     # Service configuration
├── interfaces.xml   # Interface/DI wiring
├── logging.xml      # Logging configuration
└── remoting.xml     # Remoting/communication config
```

## Service Domains

| Domain | Purpose | Key Projects |
|--------|---------|-------------|
| system | Core platform (auth, config, data) | system.common, core.common, data.common, core, content |
| list | Contact/list management | list.common, core, import, content |
| mail | Email delivery | mail.common, core, content |
| smta | SMTP/messaging | smta.common, core, websvc, network, premailer, emailrender |
| forms | Form builder | common, core, content |
| survey | Survey engine | common, core, content |
| event | Event management | common, core, content |
| txt | Text messaging | common, core, content |
| push | Push notifications | common, core, content |
| share | Social sharing | share.common, core.common, core, content |
| grpc | gRPC service layer | (service endpoints) |
| webhooks | Webhook integrations | (engage, etc.) |

## Shared Infrastructure

| Project | Location | Purpose |
|---------|----------|---------|
| u2ool.common | u2ool/common/ | Base utilities shared across all domains |
| data | u2ool/data/ | Data access layer |
| web | u2ool/web/ | Web framework utilities |
| esl | u2ool/esl/ | ESL processing |
| testing | u2ool/testing/ | Shared test utilities |
| protobuf.remoting | u2ool/protobuf.remoting/ | Protobuf/gRPC remoting |

## Hosting

| Project | Purpose |
|---------|---------|
| uqhost/uqhost | Windows service host |
| uqhost/console | Console host (dev) |
| uqhost/public | Public-facing host |
| uqhost/service | Service wrapper |

## API

| Project | Purpose |
|---------|---------|
| apiv2/ | REST API v2 (separate solution: api2.sln) |

## Deployment

| Project | Purpose |
|---------|---------|
| deploy/contentLoader | Content deployment tool |
| deploy/migrate | Database migration tool |
| deploy/UpdateRuntimeConfigGCServer | GC config updater |

## NuGet Sources

- `nuget.org` — public packages
- `github` — `https://nuget.pkg.github.com/qriousnz/index.json` (private org packages)

## Build & Run

```bash
dotnet build u3.sln
dotnet test u3.sln
```

## MVC Project (Legacy .NET Framework)

The `mvc/` folder is a separate legacy .NET Framework 4.8 project with its own conventions that differ from the .NET 8 solution.

### File Placement Rules

| Type | Location | Namespace | Example |
|------|----------|-----------|---------|
| Data/entity classes | `mvc/code/Info/{Domain}/` | `Ubiquity.uSuite3.Web.Info.{Domain}` | `Info/Connector/FieldUsageEntry.cs` |
| Static utility/service classes | `mvc/code/Infrastructure/` | `Ubiquity.uSuite3.Web.Infrastructure` | `Infrastructure/ConnectorFieldUsageService.cs` |
| Controllers | `mvc/code/Controllers/{Area}/` | `Ubiquity.uSuite3.Web.Controllers.{Area}` | `Controllers/Lists/SchemaController.cs` |
| URL helpers | `mvc/code/Urls/` | `Ubiquity.uSuite3.Web` | `Urls/Lists.cs` |
| Views/partials | `mvc/mvc/Views/{Area}/{Controller}/` |  | `Views/Lists/Schema/connector_warnings_dialog.ascx` |

### MVC Don't Do This

- **Don't create new top-level folders** like `Services/`, `Helpers/`, etc. Use the existing `Info/{Domain}/` and `Infrastructure/` structure.
- **Don't use interfaces for single-implementation services.** The MVC project doesn't use DI. Make services static classes that read `Settings` directly.
- **Don't pass config via constructors.** Use `Settings.PropertyName` directly inside the service. Follow the `HttpProxy.cs` pattern: `static class`, `Lazy<HttpClient>`, no constructor.
- **Don't forget to update `code.csproj`.** This is a legacy `.csproj` with explicit `<Compile Include="..." />` entries — new files must be added manually.

## Navigation Tips

1. Start from the domain — identify which service area the change belongs to
2. Check `{domain}/common/` for shared types and interfaces
3. Check `{domain}/core/` for business logic
4. Check `{domain}/nunit/` for existing test patterns
5. Check XML configs for service wiring before modifying DI
6. Check `u2ool/` for shared utilities before creating new ones
