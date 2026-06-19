# Spike: C# Token Verification Vulnerabilities

**Type:** Spike / Security
**Priority:** High
**Project:** MCS FY2027 Modernization
**Related:** Implicit Flow -> PKCE (MCS Dual Auth)

---

## Summary

The C# Azure Functions API (`ZespriAuthorizeAttribute` + `AccessTokenProvider`) has multiple security vulnerabilities in how it validates and authorises incoming JWT tokens. These bugs exist regardless of which auth flow produces the token and need fixing independently of the PKCE migration.

---

## Discovery Findings

### CRITICAL: Permission Check Logic Bug (Privilege Escalation)

**File:** `ZespriOAuth/ZespriAuthorizeAttribute.cs` (~line 87)

```csharp
var correspondingClaims = new List<ZespriPermission>();

int requiredFeaturePermissionsCount = 0;
_featuresPermissionsClaims.ForEach(f =>
{
    f.Permissions.ForEach(fp =>
    {
        requiredFeaturePermissionsCount++;
        var correspondingClaim = permissionsClaims.FirstOrDefault(c =>
            c.McsFeature == f.Feature && c.McsPermission == fp);
        correspondingClaims.Add(correspondingClaim);  // ← ADDS NULL IF NOT FOUND
    });
});

hasAllProtectedClaims = (requiredFeaturePermissionsCount <= correspondingClaims.Count);
// ↑ ALWAYS TRUE because nulls are added to the list
```

**The bug:** `correspondingClaims.Add(correspondingClaim)` adds `null` when `FirstOrDefault` finds no match. The count check `requiredFeaturePermissionsCount <= correspondingClaims.Count` is ALWAYS true because the list grows by 1 for every required permission regardless of whether it was found.

**Impact:** Any authenticated user passes ANY permission check. `[ZespriAuthorize("samplerequest/Write")]` is effectively just `[ZespriAuthorize]` (any valid token). A read-only user can write. A hazards-only user can modify sample requests.

---

### CRITICAL: God-Mode Admin Bypass Too Broad

**Where it's checked** - `ZespriOAuth/ZespriAuthorizeAttribute.cs` (~line 73):

```csharp
// If is_zespri is true, skip ALL permission checks entirely
hasAllProtectedClaims = tokenValidationResult.Principal.IsZespriAdminUser();
```

```csharp
// ClaimsPricipalExtensions.cs
public static bool IsZespriAdminUser(this ClaimsPrincipal claimsPricipal)
{
    var isZespriClaim = claimsPricipal.Claims.FirstOrDefault(claim => claim.Type == Constants.Claims.isZespri);
    return (isZespriClaim != null && bool.TryParse(isZespriClaim.Value, out bool result) && result);
}
```

**Where it's set** - `src/helpers/request/mint-auth-token.ts`:

```typescript
is_zespri: permissions.some((p) =>
    [
        ECrmRole.ZESPRI_MCS_ADMIN,
        ECrmRole.ZESPRI_MCS_ADMIN_TIER_2,
        ECrmRole.ZESPRI_MCS_SUPPORT,
        ECrmRole.ZESPRI_USER,                    // ← most basic internal role
        ECrmRole.ZESPRI_USER_WITH_MA_DOWNLOAD,   // ← basic role
    ].includes(p.crm_role),
),
```

**Impact:** The `is_zespri` flag is `true` for ANY internal Zespri employee, including the most basic "Zespri User" role. When this flag is `true`, the C# API skips all permission checks entirely - no feature check, no KPIN scoping, nothing.

This means a basic "Zespri User" who should only have read access to orchard information can actually write sample requests, change states, modify hazards, upload CSVs - anything. The `[ZespriAuthorize("samplerequest/Write")]` attributes on endpoints are effectively ignored for every internal user.

**Fix:** `IsZespriAdminUser()` should only return `true` for `Zespri MCS Administrator User`, not for every internal role.

---

### CRITICAL: C# API Accepts Unsigned Tokens

**File:** `ZespriOAuth/AccessTokenProvider.cs` (~line 60)

```csharp
var tokenParams = new TokenValidationParameters()
{
    RequireSignedTokens = false,        // ← ACCEPTS UNSIGNED TOKENS
    ValidAudience = _audience,
    ValidateAudience = false,           // ← DOESN'T CHECK AUDIENCE
    ValidIssuer = _issuer,
    ValidateIssuer = false,             // ← DOESN'T CHECK ISSUER
    ValidateIssuerSigningKey = false,   // ← DOESN'T VALIDATE SIGNING KEY
    ValidateLifetime = true             // ← Only thing it checks
};
```

**Mitigating factor:** The `AccessTokenProvider` first calls the upstream auth server (`/api/authz/validateToken`) to validate the token before locally parsing it. If that server validates the signature, the local skip is redundant but not directly exploitable.

**Still a problem because:**
- If the auth server is down or returns 200 incorrectly, the C# API trusts any non-expired token
- Defence in depth is violated - the API should validate independently
- After PKCE migration, the validation strategy will change - this code needs rewriting regardless

---

## Recommended Remediation

### Fix Now (No PKCE dependency) - 1-2 days

| # | Fix | Effort | Risk |
|---|-----|--------|------|
| 1 | **Fix permission check bug** - change count check to `correspondingClaims.Count(c => c != null) >= requiredFeaturePermissionsCount` | 30 min | Low (makes auth stricter - may reveal users with unintended access) |
| 2 | **Fix admin bypass** - `IsZespriAdminUser` should check for `Zespri MCS Administrator User` role, not just `is_zespri` flag | 1 hour | Medium (need to confirm which roles should be full admin) |
| 3 | **Enable signature validation** - set `RequireSignedTokens = true`, `ValidateIssuerSigningKey = true`, provide the HMAC key from env vars | 2-3 hours | Medium (need to confirm the signing key is available to the C# API) |

### Fix With PKCE Migration (absorbed into that ticket)

| # | Fix | Notes |
|---|-----|-------|
| 4 | Enable issuer + audience validation | Values depend on new token format from PKCE flow |
| 5 | Remove dual-validation pattern (local parse + auth server call) | Simplify to one validation path |
| 6 | Decide if custom MCS token survives or is replaced by Entra ID token | Architecture decision |

---

## Acceptance Criteria

- [ ] Permission check correctly rejects users without required permissions (test: user with only `hazards/Read` cannot call `[ZespriAuthorize("samplerequest/Write")]` endpoint)
- [ ] Admin bypass only applies to actual admin roles (`Zespri MCS Administrator User`), not all internal Zespri users
- [ ] Token signature is validated by the C# API (unsigned/tampered tokens rejected)
- [ ] All existing auth flows still work (login, permission-gated actions, KPIN scoping)

---

## Regression Testing

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Admin user full access | Login as Zespri MCS Administrator > Access all features | Full access works |
| 2 | Support user limited access | Login as Support > Try admin-only actions | Correctly blocked |
| 3 | SSP user KPIN-scoped | Login as SSP > View only their allocated KPINs | Only their data visible |
| 4 | TSP user feature-scoped | Login as TSP > Try sample request write | Blocked (read only) |
| 5 | Packhouse user scoped | Login as Packhouse > View only their packhouse data | Correctly scoped |
| 6 | Expired token | Wait for token expiry > Make request | 401 returned |
| 7 | Tampered token | Modify token payload, send to API | 401 returned |
| 8 | Basic Zespri User (not admin) | Login as "Zespri User" role > Try admin actions | NOW BLOCKED (was incorrectly allowed before) |

**WARNING:** Fixes #1 and #2 will make auth STRICTER. Users who previously had unintended access will lose it. Needs a Dynatrace audit and communication to Zespri before deploying to production.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Fixing permission bug breaks users who relied on the bug | Audit `vw_mcs_auth` to identify users with minimal permissions. Compare against Dynatrace usage logs. |
| Fixing admin bypass locks out Zespri internal users | Confirm with Zespri which roles should be full admin vs restricted. |
| Enabling signature validation breaks if C# API doesn't have the signing key | Verify `MCS_AUTHZ_TOKEN_SIGN_KEY` is in Azure Function App Settings for all environments. |

---

## Estimate

**1-2 days** (fixes + testing). Deploy to DEV/TST first, audit impact, then PPE/PRD with Zespri sign-off.
