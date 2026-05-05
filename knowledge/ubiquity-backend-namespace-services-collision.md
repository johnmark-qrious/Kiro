---
sync: draft
notionPageId:
lastLocalEdit:
lastPublished:
---

# Namespace Collision: `Services` in mvc/code

The namespace `Ubiquity.uSuite3.Web.Services` collides with an existing class `Ubiquity.uSuite3.Web.ViewModels.Administrators.Smta.Services` (in `mvc/code/ViewModels/Administrators/SMTA/Services.cs`).

The C# compiler sees `Services` as both a namespace and a type under the same root namespace, causing `CS0118: 'Services' is a namespace but is used like a type`.

**Fix:** Don't use `Services` as a namespace under `Ubiquity.uSuite3.Web`. We used `Ubiquity.uSuite3.Web.ConnectorServices` for the database-change-alert feature.

**Affected:** Any new `.cs` files placed in `mvc/code/Services/`. The folder name `Services` is fine — just don't use it as the namespace segment.
