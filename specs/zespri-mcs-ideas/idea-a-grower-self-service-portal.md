---
status: draft
priority: 1
wave: 1
cooperation_probability: 90%
estimate: 6 weeks / $75-100K NZD
---

# Idea A: Grower Self-Service Portal

## Executive Summary

A lightweight, mobile-first web application giving kiwifruit growers direct visibility into their orchard's maturity clearance status. Growers check clearance progress, view test results, and see upcoming schedules from their phone without calling support.

**Not** a responsive rework of MCS. A separate, greenfield satellite app with zero coupling to the existing codebase.

## Problem Statement

- 5,000 MCS users, majority are growers
- During harvest (6-8 weeks), growers repeatedly check: "Is my fruit cleared yet?"
- Current MCS is desktop-only (zero responsive CSS, no mobile support)
- Support staff overwhelmed during harvest window
- Every support call costs time and money
- Growers are in orchards, not at desks - need mobile access for a 10-second status check

## Business Case

| Metric | Value |
|--------|-------|
| Support tickets during harvest | 40+/week (estimated) |
| Growers locked out of mobile | 4,800+ |
| Support cost per call | ~$15-25 NZD (staff time) |
| Seasonal support cost (8 weeks) | $50-80K NZD |
| Build cost | $75-100K NZD |
| Payback period | 1-2 seasons |

## Requirements

### Functional

1. **Orchard Status Screen (Home)**
   - List grower's orchards/blocks with current clearance status
   - Traffic light: Red (not cleared), Amber (testing in progress), Green (cleared)
   - Tap to expand: maturity areas, varieties, expected timeline
   - Pull-to-refresh

2. **Test History Screen**
   - Timeline of all sample requests for grower's KPINs
   - Each entry: date collected, date tested, result (DM%, Brix), clearance outcome
   - Filter by season, variety, block

3. **Clearance Certificate Screen**
   - Downloadable PDF/view of official clearance status
   - Shows: KPIN, block, variety, clearance date, criteria met
   - Shareable with packhouse operators

4. **Push Notifications**
   - Notify on clearance status change
   - Notify on sample collection scheduled
   - Configurable (grower can mute)

5. **Authentication**
   - Azure AD B2C (separate from internal MCS auth)
   - SMS passwordless for growers without email
   - KPIN-scoped access (grower sees only their own data)
   - Zespri admin approval workflow for new registrations

### Non-Functional

- Mobile-first (PWA, works in any browser)
- Offline-capable for status display (last-known state cached)
- Page load < 2 seconds on 3G
- 60-second stale-while-revalidate caching (growers don't need real-time)
- Dedicated DB connection pool (max 10) to prevent starving core MCS
- Zero dependency on existing MCS codebase or Azure Functions API

## Technical Design

### Architecture

```
+---------------------------------------------------+
|  Grower Portal (NEW)                              |
|  Next.js 15 | React 19 | App Router | PWA         |
|  Mobile-first | Tailwind CSS                       |
|                                                   |
|  Auth: Azure AD B2C (grower tenant)               |
|  Data: Direct SQL read queries via Prisma          |
|  Notifications: Azure Notification Hubs            |
+----------------------------+----------------------+
                             |
                    SQL read queries
                    (dedicated pool, max 10)
                             |
                             v
+---------------------------------------------------+
|  MCS SQL Server Database (existing)               |
|  No schema changes needed                          |
|                                                   |
|  Views consumed:                                   |
|  - vw_SampleReportMaturityAreaDetails              |
|  - SampleRequest (status, dates)                   |
|  - Orchard/Block associations                      |
|  - CalcResult (clearance outcomes)                 |
+---------------------------------------------------+
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15 (App Router) | Greenfield, RSC for fast loads, no legacy constraints |
| Auth | Azure AD B2C | Grower self-registration, SMS passwordless, separate from internal |
| Data access | Direct SQL via Prisma | Same DB, read-only. No dependency on C# API layer |
| Connection isolation | Dedicated pool (max 10) | Prevents portal from starving core MCS |
| Caching | 60s stale-while-revalidate (RSC) | 1-minute staleness acceptable for growers |
| Notifications | Azure Notification Hubs | Push to PWA when clearance status changes |
| Hosting | Azure App Service (same subscription) | Consistent with MCS hosting model |

### Bulk Onboarding (4,800+ growers)

| Step | Method | Duration |
|------|--------|----------|
| Extract grower list | SQL query from [dbo].[MCSUser] where role = grower | Minutes |
| Create B2C accounts | Microsoft Graph API batch (240 batches x 20 users) | ~12 minutes |
| Notification | SMS to each grower with activation link | Automated |
| Auth method | SMS passwordless (B2C custom policy) | No email required |
| Approval | Zespri admin approves batch, or auto-approve from known KPIN list | Configurable |

## Cost Estimate

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Setup | Project scaffold, B2C config, DB connection, CI/CD | 1 week | $12-15K |
| Orchard Status | Home screen + data queries + traffic light logic | 1.5 weeks | $18-22K |
| Test History | Timeline screen + filtering | 1 week | $12-15K |
| Clearance Certificate | PDF generation + download | 1 week | $12-15K |
| Push Notifications | Status change triggers + Azure Notification Hubs | 0.5 weeks | $6-8K |
| Bulk Onboarding | Script + B2C setup + testing | 0.5 weeks | $6-8K |
| UAT + Polish | User testing with growers, fixes | 0.5 weeks | $6-8K |
| **Total** | | **6 weeks** | **$75-100K** |

### Ongoing Costs

| Item | Monthly |
|------|---------|
| Azure App Service (B1) | ~$50 |
| Azure AD B2C (50K auth/month) | ~$25 |
| Azure Notification Hubs (Basic) | ~$10 |
| Total hosting | ~$85/month |

## Validation & Testing

### Acceptance Criteria

- [ ] Grower can log in via SMS passwordless on mobile
- [ ] Grower sees only their own KPINs (no data leakage)
- [ ] Traffic light status matches actual MCS clearance state
- [ ] Test history shows correct DM% and dates for last 2 seasons
- [ ] Clearance certificate PDF generates with correct data
- [ ] Push notification fires within 5 minutes of clearance status change
- [ ] Page loads in < 2 seconds on simulated 3G
- [ ] Core MCS performance unaffected (connection pool isolation verified)

### How to Validate (Proof of Concept)

1. **Week 1:** Build status screen for 5 test KPINs. Show to Zespri Grower Relations.
2. **Week 3:** Invite 10 real growers to beta. Measure: do they stop calling support?
3. **Week 6:** Full launch. Track support ticket volume vs previous season.

### Kill Conditions

- Zespri explicitly chooses another vendor for this work
- Support ticket volume is actually low (< 10/week) - no problem to solve
- B2C tenant setup blocked by Zespri IT security policy

## Stakeholder Sign-off Required

- [ ] Zespri Digital Ops (Tim Lloyd) - project approval
- [ ] Zespri Grower Relations - confirms demand
- [ ] Zespri IT Security - B2C tenant approval
- [ ] Zespri Finance - budget approval

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Database load from portal queries | Low | Medium | Dedicated connection pool, indexed views, 60s cache |
| B2C identity surface area | Low | High | Scope to grower tenant only, never bleed into internal MCS auth |
| Growers without smartphones | Low | Low | PWA works in any browser. SMS notifications work on feature phones. |
| Grower data privacy | Medium | High | KPIN-scoped queries only. B2C token contains KPIN claims. Server-side filtering. |
| Zespri uses another vendor | Medium | High | Lead with domain knowledge advantage. Offer data layer split if needed. |
