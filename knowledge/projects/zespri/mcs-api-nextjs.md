---
sync: draft
lastLocalEdit: 2026-05-13T14:17:00+12:00
---

# Zespri MCS - Next.js API Routes (Complete Reference)

> **Source:** Code-verified from `C:\Projects\Experimental\Z\Zespri.MCS.UI\pages\api\` with caller tracing via grep across src/ and pages/.

## Summary

- **Total route files:** ~120+
- **Active domains:** 40+ folders under pages/api/
- **Auth breakdown:** ~90% `RequestUtils.secure` (JWT), ~5% `RequestUtils.insecure` (API key), ~5% raw/mock
- **Data source:** ~95% Prisma (SQL Server direct), ~2% Azure Blob, ~1% Azure Functions API, ~2% External (Power BI, SendGrid)
- **External-facing APIs:** packhouse/* (rate-limited), sample-request PUT (SSP/TSP), test-results PUT (TSP), send/notification (API key)
- **Mock/placeholder:** areas, associations, samplerequests, samplerequestsfilters, orchards/[kpin], packhouses/[id], maps

---

## Auth Pattern

```typescript
// Secure (90% of routes) - validates MCS JWT
export default RequestUtils.secure((req, res, body, user, prisma) => { ... })

// Insecure (external callers with API key)
export default RequestUtils.insecure((req, res, body, prisma) => { ... })
```

**Permission checks inside handlers:**
- `user.is_zespri` - Zespri internal user (admin bypass)
- `user.permission_obj.some(p => p.mcs_feature === EMcsFeature.X && p.mcs_permission === EMcsPermission.Write)` - feature+permission
- `user.permission_obj.some(p => p.crm_role === ECrmRole.ZESPRI_MCS_ADMIN)` - role check
- KPIN-scoped: `user.permission_obj.some(p => p.kpin === targetKpin || p.kpin === -1)` - wildcard or specific

---

## 1. Authentication Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/auth/callback` | POST | raw | None | ADFS IdP (external) | ADFS form_post after SSO |
| `/api/auth/request-token` | GET | insecure | Valid ADFS Bearer | `Login` component | Page load (getMcsToken) |
| `/api/auth/validate-token` | GET | secure | Any valid token | `Login` component | After token obtained |
| `/api/auth/request-impersonation-token` | POST | secure | Admin/AdminTier2/Support | `ImpersonateModal` | Impersonate button |

---

## 2. Sample Request Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/sample-request` | PUT | secure | SampleRequest Write (TSP/SSP) | **External SSP/TSP systems** | State transitions via eAPI |
| `/api/sample-request/hold-comments` | GET,POST | secure | Authenticated | `HoldCommentModal` | Modal open/save |
| `/api/sample-request/release-comments` | GET,POST | secure | Authenticated | `ReleaseCommentModal` | Modal open/save |
| `/api/sample-request/zero-rates` | GET,POST | secure | is_zespri | `ZeroRateChargesModal`, `CancelModal` | Modal open/save |
| `/api/update-status` | PUT | secure | SampleRequest Write (KPIN) | `StatusModal` | Form submit |
| `/api/update-criteria` | PUT | secure | Admin/Support roles | **No UI callers found** | Possibly admin tool |
| `/api/duplicate-request` | POST | secure | Authenticated | `AssociationsTableActions`, `CancelModal` | Duplicate/compromise flow |
| `/api/collection-date` | PUT | secure | Associations Write | `AssociationsTableActions` | Date picker change |
| `/api/cancel-reasons` | GET | secure | Authenticated | `CancelModal`, `StatusModal` | Component mount |
| `/api/test-results` | PUT | secure | TestResult Write + TSP | **External TSP systems** | Bulk result upload |
| `/api/samplerequests/validation/*` | POST | secure | Various | `SampleRequestForm`, `SamplingAreaForm` | Form validation |
| `/api/samplerequestsfilters/filter-set` | GET,POST,DEL | secure | Authenticated | `SearchAndFilter` | Filter CRUD |

---

## 3. Orchard & Hazard Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/kpin-list` | POST | secure | KPIN-scoped | `KpinList` | Search/filter/paginate |
| `/api/orchard/hazard` | POST | secure | Hazards Write (KPIN) | `OrchardHazardForm` | Create hazard (also calls C# API) |
| `/api/orchard/hazard/logs` | POST | secure | Authenticated | `OrchardHazardForm`, `TableActiveOptions` | After hazard CRUD |
| `/api/orchard/part-block/is-editable` | POST | secure | Authenticated | `Blocks`, `PartBlockForm` | Load/edit check |
| `/api/orchards/[kpin]/flag` | PUT | secure | Admin/Support | `Orchard` | Flag toggle |
| `/api/orchards/[kpin]/hazards/verify` | POST | secure | Hazards Write (KPIN) | `OrchardHazardTable` | Verify button |
| `/api/orchards/[kpin]/info` | GET,POST | secure | OrchardInfo (KPIN) | `OrchardInformation` | Mount/save |
| `/api/orchards/[kpin]/part-blocks` | POST | secure | Blocks Write (KPIN) | `PartBlockForm` | Create part-block |
| `/api/orchards/[kpin]/part-blocks/[id]` | PUT,DEL | secure | Blocks Write (KPIN) | `PartBlockForm`, `Blocks` | Edit/delete |
| `/api/site-requirements/[kpin]` | PUT | secure | AccessRequirement Write | `OrchardInformation` | Save site reqs |
| `/api/blocks-year-producing` | PUT | secure | Authenticated | `PartBlockForm` | Toggle FYP flag |

---

## 4. Release Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/release` | PUT | secure | Releases Write (KPIN) | `RequestRelease`, `ReleaseTableActions` | Release/Hold button |
| `/api/release/provisional` | PUT | secure | Releases Write (KPIN) | `ProvisionalReleaseModal` | Confirm provisional |

---

## 5. Admin & Configuration Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/admin/clearance-criteria` | POST | secure | Admin | `AddCriteriaGroupModal` | Create criteria |
| `/api/admin/clearance-criteria/options` | GET | secure | Admin | `ClearanceCriteriasList` | Load filter options |
| `/api/admin/clearance-criteria/groups` | POST | secure | Admin | `ClearanceCriteriasList` | Load/filter |
| `/api/admin/clearance-criteria/groups/toggle-active-version` | POST | secure | Admin | `ClearanceCriteriaActivateModal` | Activate/deactivate |
| `/api/admin/clearance-criteria/rules` | GET,DEL | secure | Admin | `ClearanceCriteriaRulesList` | Load/delete rules |
| `/api/admin/clearance-criteria/rules/update-next-active` | POST | secure | Admin | `ClearanceCriteriaRulesList` | Toggle checkbox |
| `/api/admin/test-groups` | GET,DEL | secure | Admin | `TestGroupList` | Load/delete |
| `/api/admin/test-groups/options` | POST | secure | Admin/AdminTier2 | `TestGroupFormModal` | Selection change |
| `/api/admin/test-groups/sample-types` | POST | secure | Admin/AdminTier2 | `TestGroupFormModal` | Type change |
| `/api/admin/test-group` | POST | secure | Admin/AdminTier2 | `TestGroupFormModal` | Create/update |
| `/api/admin/test-group/sample-count` | POST | secure | Admin/AdminTier2 | `TestGroupFormModal` | Pre-status-change |
| `/api/admin/test-group/update-status` | POST | secure | Admin/AdminTier2 | `TestGroupList` | Toggle active |

---

## 6. Season Rollover Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/season-rollover/within-rollover-date` | GET | secure | Authenticated | `SeasonRollover` | Mount |
| `/api/season-rollover/get-season-selection` | GET | secure | Authenticated | `SeasonRollover` | Mount |
| `/api/season-rollover/get-counts` | POST | secure | Authenticated | `SeasonRollover` | Season change |
| `/api/season-rollover/activity-logs` | POST | secure | Authenticated | `SeasonRollover` | Season change |
| `/api/season-rollover/run-activity` | POST | secure | Authenticated | `SeasonRollover` | Run button |
| `/api/season-rollover/bands-and-caps` | GET,PUT | secure | Authenticated | `SeasonRolloverTable` | Mount/save |
| `/api/season-rollover/activities/*` (8 routes) | POST | secure | Authenticated | `SeasonRollover` | Activity dispatch |
| `/api/season-rollover/download/fyp-submit-status` | POST | secure | Authenticated | `SeasonRollover` | Download button |

---

## 7. Users & Roles Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/users` | GET | secure | Users feature | `UsersList` | Mount |
| `/api/users/[id]` | GET,PUT | secure | Own profile OR Users | `UserProfile`, `RoleOverrideModal` | Mount/save |
| `/api/users/changeStatus` | PUT | secure | Admin/AdminTier2 | `UsersList` | Status toggle |
| `/api/users/authorisation` | GET | secure | Users feature | `UsersList` | Mount |
| `/api/roles` | GET,POST | secure | Admin/AdminTier2/Support | `RolesList`, `UsersList` | Mount/create |
| `/api/roles/[id]` | GET,PUT | secure | Admin/AdminTier2/Support | `RolesList` | Edit/update |
| `/api/terms` | GET,PUT | secure | Authenticated | `TermsModal` | Mount/accept |

---

## 8. Notifications Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/notifications` | GET | secure | Admin/AdminTier2/Support | `Notifications` page | Mount |
| `/api/notifications/template` | PUT | secure | Admin/AdminTier2/Support | `Notifications` page | Toggle active |
| `/api/notifications/testgroups` | POST | secure | Admin/AdminTier2/Support | `Notifications` page | Load test groups |
| `/api/notifications/testgroup` | PUT | secure | Admin/AdminTier2/Support | `Notifications` page | Toggle override |
| `/api/ma-notifications` | POST | insecure | API key | **External Azure Function** (15-min schedule) | Scheduled trigger |
| `/api/send/notification` | POST | insecure | API key | **External backend services** | System events |
| `/api/email/send` | POST | insecure | API key | Alias for send/notification | System events |

---

## 9. Industry Pricing & Allocation Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/industry-pricing/kpin-charges` | CRUD | secure | Authenticated | `IndustryPricing/KpinCharges` | CRUD actions |
| `/api/industry-pricing/sampling-charges` | CRUD | secure | Authenticated | `IndustryPricing/SamplingCharges` | CRUD actions |
| `/api/industry-pricing/testing-charges` | CRUD | secure | Authenticated | `IndustryPricing/TestingCharges` | CRUD actions |
| `/api/industry-pricing/reporting-charges` | CRUD | secure | Authenticated | `IndustryPricing/ReportingCharges` | CRUD actions |
| `/api/allocation-percent/*` (6 routes) | Various | secure | Authenticated | `AllocationPercent` components | Mount/save/delete |
| `/api/size-management` | GET | secure | Authenticated | `SizeManagement` | Mount |
| `/api/size-management/selection` | GET,POST | secure | Authenticated | `SizeManagement` | Mount/save |

---

## 10. Clearance & Dispensation Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/kiwistart-clearance` | POST | secure | is_zespri | `KiwistartClearanceList` | Search |
| `/api/kiwistart-clearance/add` | POST | secure | is_zespri | `KiwistartClearanceModal` | Create |
| `/api/kiwistart-clearance/edit` | POST | secure | is_zespri | `KiwistartClearanceModal` | Edit |
| `/api/clearance-criteria-override` | GET,POST | secure | Authenticated | `DifferentCriteria` | Open/submit |
| `/api/ma-dispensation-rules` | GET,PUT | secure | GET: any; PUT: Admin | `MaDispensationRulesList`, `SamplingAreaForm` | Mount/save |
| `/api/dispensation-request` | POST | secure | Authenticated | `DispensationRequestList` | Search |

---

## 11. Reports & Downloads Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/reports/tables` | POST | secure | Report access check | Sample report page | Page load |
| `/api/reports/graphs` | POST | secure | Report access check | Sample report page | Page load |
| `/api/reports/industry-summary` | POST | secure | Authenticated | IndustrySummary page | Download |
| `/api/reports/industry-trend` | POST | secure | Authenticated | IndustryTrends page | Filter submit |
| `/api/reports/industry-trend/metrics` | GET | secure | Authenticated | `TrendGraphPanel` | Variety change |
| `/api/download/block-association` | POST | secure | Areas feature | `CsvDownload` | Download button |
| `/api/download/hazards` | POST | secure | Hazards feature | `CsvDownload` | Download button |
| `/api/download/hazards/logs` | POST | secure | Hazards feature | `CsvDownload` | Download button |
| `/api/download/orchard-info` | POST | secure | OrchardInfo feature | `CsvDownload` | Download button |
| `/api/download/sample/*` (3 routes) | POST | secure | SampleResults feature | `ExportSampleOptions` | Export menu |
| `/api/powerbi/auth` | POST | secure | Authenticated | `usePowerbiReport` hook | Hook init |
| `/api/powerbi/embed-token` | POST | secure | Authenticated | `usePowerbiReport` hook | After auth |
| `/api/powerbi/reports` | GET | secure | Authenticated | `usePowerbiReport` hook | Hook init |

---

## 12. Misc Domain

| Route | Method | Auth | Permissions | Caller | Trigger |
|-------|--------|------|-------------|--------|---------|
| `/api/filters` | POST | secure | Authenticated | `Login`, `AllocationPercent`, `SampleRequestFormLoader` | After auth/mount |
| `/api/file` | GET | secure | Authenticated | Map/file viewers | File access (SAS redirect) |
| `/api/current-season` | GET,POST | secure | Authenticated | Multiple components (7+) | Mount |
| `/api/sap-logs` | POST | secure | is_zespri | `SapLogsList` | Search |
| `/api/packhouses-options` | GET | secure | Authenticated | `Banner` | Packhouse selector |
| `/api/sr-companies` | GET | secure | Authenticated | `OrchardHazardForm`, `SampleRequestForm` | Form init |
| `/api/rfExpiryExtension` | POST | secure | Authenticated | `RFExpiryExtensionModal` | Submit |
| `/api/rfExpiryExtension/getAreaBlocks` | GET | secure | Authenticated | `RFExpiryExtensionModal` | Modal open |
| `/api/change-packhouse-user` | PUT | secure | Authenticated | `Banner` | Packhouse change |
| `/api/duplicate-area` | POST | secure | Admin/Support | `DuplicateAreaModal` | Confirm |
| `/api/packhouse/*` (3 routes) | GET | secure | SampleResults Read | **External packhouse systems** | Rate-limited API |

---

## External-Facing APIs (consumed by non-UI systems)

| Route | Consumer | Auth Method | Rate Limited |
|-------|----------|-------------|--------------|
| `/api/sample-request` (PUT) | SSP/TSP mobile apps | JWT (MCS token) | No |
| `/api/test-results` (PUT) | TSP lab systems | JWT (MCS token) | No |
| `/api/packhouse/fruit-results` | Packhouse systems | JWT (MCS token) | Yes (429) |
| `/api/packhouse/sample-request-info` | Packhouse systems | JWT (MCS token) | Yes (429) |
| `/api/packhouse/sample-results` | Packhouse systems | JWT (MCS token) | Yes (429) |
| `/api/send/notification` | Backend Azure Functions | API key header | No |
| `/api/email/send` | Backend Azure Functions | API key header | No |
| `/api/ma-notifications` | Azure Function (15-min schedule) | API key header | No |
