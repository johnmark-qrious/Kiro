---
sync: draft
lastLocalEdit: 2026-05-13T14:46:00+12:00
---

# Zespri MCS - Code Audit Findings

> **Audit date:** 2026-05-13. Code-verified against local codebase.

## Critical Issues

### 1. Secrets Committed to Repository

**Files:** `.env`, `.env.local`, `.env.dev`, `API Source/Zespri.MCS.Orchard/local.settings.json`

Plaintext credentials in source control:
- DB password: `3kiR4okx` (reused across PPE and TST environments)
- Azure Blob Storage account keys (full base64)
- SendGrid API key
- eTXT API key (full JWT)
- JWT signing key ID
- Notification auth key
- ADFS client IDs

**Action:** Rotate ALL credentials. Remove from git history. Use Azure Key Vault.

### 2. Suspicious Token in package.json

```json
"test": "<REDACTED - Azure DevOps PAT format, 52-char base32>"
```

Top-level field (not in `scripts`). 52-char base32 string matching Azure DevOps PAT format. Serves no functional purpose. Likely accidentally pasted credential.

**Action:** Identify and rotate. Remove from package.json.

### 3. Auth Permission Check Bug (Privilege Escalation)

**File:** `ZespriOAuth/ZespriAuthorizeAttribute.cs` ~line 87

```csharp
hasAllProtectedClaims = (requiredFeaturePermissionsCount <= correspondingClaims.Count);
```

`correspondingClaims` list includes null entries from `FirstOrDefault` when no match found. A user with N *any* permissions could pass a check requiring N *specific* permissions because nulls are counted.

**Fix:** `correspondingClaims.Count(c => c != null) >= requiredFeaturePermissionsCount`

### 4. God-Mode Admin Flag

**File:** `ZespriAuthorizeAttribute.cs` ~line 73

```csharp
hasAllProtectedClaims = tokenValidationResult.Principal.IsZespriAdminUser();
```

If true, ALL feature/permission checks are skipped. Any token with the `is_zespri` claim gets unrestricted access to every endpoint. If this claim can be spoofed or the auth service compromised, full system access is granted.

### 5. Token Stored in localStorage Without Expiry Check on Reload

**File:** `src/components/Login/index.tsx`

MCS_TOKEN stored in localStorage. On page reload, reused without checking expiry. The `setTimeout` logout only works for the current browser session. XSS would expose token indefinitely.

---

## Warnings

### 6. jose v2 (End of Life)

`"jose": "^2.0.7"` - EOL, current is v5+. Known issues. Author recommends upgrade.

### 7. TLS Verification Disabled for ADFS Key Fetch

**File:** `pages/api/authz/requestToken.ts`

```typescript
agent: new https.Agent({ rejectUnauthorized: false })
```

Disables certificate verification when fetching ADFS public keys. Vulnerable to MITM. Comment says "No need to check signature chain on public key" - this is incorrect.

### 8. Silent Auth Error Swallowing

**File:** `src/helpers/request/request.ts`

```typescript
} catch (e) {}
```

Token verification errors silently swallowed. Makes debugging auth failures impossible.

### 9. adal-angular Deprecated

`"adal-angular": "^1.0.18"` - Microsoft ended ADAL support June 2023. Should migrate to MSAL.

### 10. ExceptionDbLogger Bugs

**File:** `Zespri.MCS.Utilities/ErrorHandling/ExceptionDbLogger.cs`

- Silently swallows exceptions with `FrameCount <= 1` (shallow stacks disappear)
- Overwrites `MethodName` with `SprocName` when both provided (loses method context)

### 11. Static Mutable ExceptionDbLogger (Race Condition)

**File:** `ApiBase.cs`

```csharp
public static ExceptionDbLogger _exceptionLogger;
```

Initialized in constructor of each API instance. Under concurrency, one request's logger uses another request's (possibly disposed) DbContext.

### 12. Wildcard CORS

**File:** `local.settings.json` - `"CORS": "*"`

If this pattern leaks to deployed config, any origin can call the API.

---

## Oddities

### 13. Database Test Artifacts in Production Schema

Tables scaffolded into production data access layer:
- `T` - table literally named "T" (has real domain columns: Variety, Growmethod, Tasteband)
- `TestTbl1` - test table (Id, Name)
- `Temp` - single column named "B"
- `BlockBak0511` - backup from May 11?
- `ClearanceCriteriaSwap0312` - swap from March 12?
- `SampleResultLoadTest10` - load test artifact
- `VwSampleReportMaturityResultsOld`, `*Bak` - old/backup views

**Total staging/temp entities:** 82 files (Stg* 59, *Tmp* 23, *Temp* 12)

### 14. Mock Routes Deployed and Accessible

These Next.js API routes return mock/hardcoded data with NO authentication:
- `/api/areas` - hardcoded area data
- `/api/associations` - mock from mockData.ts
- `/api/samplerequests` - mock sample requests
- `/api/samplerequestsfilters` - mock filters
- `/api/orchards/[kpin]` - mock orchard
- `/api/packhouses/[id]` - mock packhouse
- `/api/maps`, `/api/maps/[id]` - JSON passthrough (no auth, 10MB body limit)

### 15. Outdated Dependencies

| Package | Current | Latest |
|---------|---------|--------|
| typescript | 4.9 | 5.5+ |
| eslint | 7.7 | 9+ |
| @typescript-eslint/* | 3.10 | 8+ |
| @testing-library/react | 11.0 | 16+ |
| yup | 0.29 | 1.4+ |
| jose | 2.0 | 5+ |
| adal-angular | 1.0 | DEPRECATED |

### 16. Prisma Preview Features Now GA

```prisma
previewFeatures = ["microsoftSqlServer", "referentialActions"]
```

Both GA since Prisma 4.x. Unnecessary with Prisma 5.6.

### 17. coverage/ Directory Committed

Build output in version control.

### 18. SampleRequestApi.cs Self-Admitted Hacks

- Line 1558: `"I am sorry this is hacky"` - status override logic
- Line 1816: `"TODO: need to understand the business logic to rewrite this better"`
- Line 636: Commented-out code with `"Andrey looking into what the original intent of this was"`

### 19. NZ Timezone Hardcoded

```csharp
const string timezoneId = "New Zealand Standard Time";
// When we come to do the internationalization stuff, then we need to fix this 🙂
```

---

## Risk Summary

| Severity | Count | Top Priority |
|----------|-------|--------------|
| Critical | 5 | Credential rotation, auth bypass fix |
| Warning | 7 | jose upgrade, TLS fix, MSAL migration |
| Odd | 7 | DB cleanup, mock route removal, dep updates |
