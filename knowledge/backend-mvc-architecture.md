---
sync: draft
notionPageId:
lastLocalEdit:
lastPublished:
---

# QT-Ubi-UbiquityBackend — MVC Project Architecture

## Overview
Legacy ASP.NET MVC 5 monolith running on IIS. .NET Remoting to backend services. No DI container — everything is static singletons and service locators. Two generations coexist: legacy Razor views and a React/Next.js bridge.

## Solution Layout
- `mvc/mvc/` — Web host (thin shell: Web.config, Global.asax, Views, Assets)
- `mvc/code/` — Main code library (173KB csproj)
  - `Controllers/` — By domain (Campaigns, Surveys, Forms, Events, Lists, Administrators, TXT, Push, Widgets, ReactView, ReactApi, FrontendAppProxy)
  - `ViewModels/` — Mirrors controller domains
  - `Infrastructure/` — Bootstrap, settings, 50+ cache classes, auth
  - `Routing/Routes.cs` — 148KB, 633 routes, single method
  - `Urls/` — 28 files, 23K lines of strongly-typed URL helpers
- `mvc/content/` — XML config (widget.xml, textstring.xml, applications.xml)
- XML-driven config: settings.xml (app settings + AWS SSM), interfaces.xml (.NET Remoting wiring)

## Key Patterns
- **No DI** — `Remote<T>.Execute()` service locator, `Cache.Get<T>()` static globals, `new RequestHelper()` for HTTP context
- **Fat legacy controllers** — 30-156KB, inline business logic, no service layer
- **Lean ReactApi controllers** — 5-15 lines per action, single Remote call → JSON
- **FrontendAppProxy** — Reverse proxy to Next.js, forwards auth as Protobuf-encoded headers (X-Current-Session)
- **Castle Validator + xVal** — Obsolete validation stack (circa 2009). FluentValidation in bin but unused
- **Schema cache patching** — Version-based incremental updates, avoids full reloads
- **DataStoreItem** — Server-side session state for multi-step wizards (Couchbase-backed)
- **OWIN auth** — Cookie auth + OpenID Connect (AWS Cognito), `__Host-` prefixed cookies
- **EncodedGuid** — GUIDs never raw in URLs, always base64-encoded

## Controller Domains
| Domain | What | Notable |
|--------|------|---------|
| Campaigns/ | Email campaigns, mailouts, templates | MailoutDesignController 156KB |
| Surveys/ | Survey design, responses, reports | DesignController 107KB |
| Lists/ | Contact lists, schema, imports | DataController 119KB, SchemaController 36KB |
| Administrators/ | Admin panel, billing, SMTA | SMTAController 122KB |
| ReactView/ | Thin controllers serving React shell | Bridge to new frontend |
| ReactApi/ | JSON endpoints for React frontend | Clean POCOs, stateless |
| FrontendAppProxy/ | Reverse proxy to Next.js apps | Auth-aware gateway |

## Two ViewModel Systems
- **Legacy** — Extends `ViewModel` base (session, account tree, scripts, feature flags). Used with Razor views.
- **ReactApi** — Plain POCOs/DTOs. `BaseApiDataModel` wrapper. No session context. Clean break.

## Migration Pattern (Strangler Fig)
```
Legacy ASPX → ReactView (shell) → ReactApi (JSON) → FrontendAppProxy → Next.js
```
- FrontendAppProxy is the endgame — new features go to Next.js, proxied for auth
- ReactApi is the intermediate step — React inside MVC shell
- Legacy controllers: leave alone, stop adding to them
- gRPC backend (main u3.sln) is the real service layer

## Critical Risks
- .NET Remoting is deprecated — blocks .NET Core migration
- System.Web coupling — no path to ASP.NET Core without full rewrite
- No circuit breakers on Remote<T> calls — backend down = cascading failure
- Routes.cs 633 routes in one method — order-sensitive, merge conflict magnet
- DataStoreItem server-side state — fragile across restarts, no horizontal scaling

## Auth Flow
1. OWIN cookie auth (3 cookies: session, 2FA, 2FA-remember)
2. OpenID Connect via AWS Cognito (conditional on SsoEnabled)
3. FrontendAppProxy forwards session as Protobuf → Base64 in X-Current-Session header
4. Next.js frontend reads claims from forwarded headers

## Caching
- 30+ typed caches registered at startup
- In-memory + Couchbase backing (VolatileMemoryCache)
- Schema caches use version-based patching (incremental updates)
- DataStoreItem cache: 2min memory, 36hr Couchbase, 7d preview
- Widget cache: keyed by session+type+item, explicit MarkDirty() invalidation
