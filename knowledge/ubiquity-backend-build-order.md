---
sync: draft
notionPageId:
lastLocalEdit:
lastPublished:
---

# Build Order: QT-Ubi-UbiquityBackend

The mvc project depends on DLLs produced by backend service projects (survey, forms, event, mail, etc.). These live in the `u3.sln` master solution.

**Build order after pulling new changes:**
1. `u3.sln` — Rebuild (produces backend service DLLs including interfaces like ITriggeredEmailManager)
2. `mvc/mvc.sln` — Rebuild (picks up updated DLLs)
3. `apiv2/api2.sln` — Rebuild (only if working on APIv2)

**Common symptom when skipping u3.sln:** `'ITriggeredEmailManager' does not contain a definition for 'X'` — means the interface was updated in a backend service project but the DLL hasn't been rebuilt.

**After merging release branch changes:** Always rebuild `u3.sln` first, then `mvc.sln`. The Confluence guide only mentions mvc.sln and api2.sln, but u3.sln is the prerequisite.

**Anti-forgery token errors:** Not a code issue. Clear browser cookies and log in fresh. Happens after IIS app pool recycles or session identity changes.
