---
sync: modified
lastLocalEdit: 2026-05-13T20:54:00+12:00
---

# Gotcha: Cross-Repo Deployment Readiness

## What Happened
PR #192 shipped the activate connector warning modal but missed two cross-repo dependencies:
1. `PLATFORM_API_BILLING_GRPC_URL` wasn't in terraform configs (app hit `http://placeholder` at runtime)
2. No price record existed in the billing DB (service returned empty, modal showed "unavailable")

Both worked locally because `.env` had the URL and we had a local DB. Bug #3546529.

## The Pattern
When a feature calls an external service, "code complete" is not "ship ready". The full chain needs to work in deployed environments, not just locally.

## Pre-Ship Checklist (any feature touching an external service)

### 1. Environment Config
- [ ] New env vars added to `env.ts` / `.env.template`
- [ ] Same env vars added to terraform for ALL environments (dev/test/prod)
- [ ] Actual service URLs confirmed with the team that owns the service
- [ ] Don't rely on Zod/config defaults masking missing values

### 2. Service Availability
- [ ] Is the service deployed in the target environment?
- [ ] Is it reachable from our app? (network, security groups, DNS)
- [ ] Has the service been tested with a real request? (not just "it's running")

### 3. Data Dependencies
- [ ] Does the service need seed data to respond correctly?
- [ ] Have migrations been run in the target environment?
- [ ] Are there any data setup steps that happen outside of code deploys?

### 4. Graceful Degradation
- [ ] If the service is down or data is missing, does the UI handle it without showing raw errors?
- [ ] Is the fallback UX acceptable to ship with? (e.g. "pricing unavailable" vs broken modal)

## URL Pattern for Internal Services
`https://{service}.internal.ubiquity-{env}.co.nz:{port}`

## Env Var Terraform Checklist
- `tf/database/environments/dev.hcl`
- `tf/database/environments/test.hcl`
- `tf/database/environments/prod.hcl`

## Don't Do This
- Don't assume "works locally" means "works deployed"
- Don't merge a feature that depends on another repo's data without confirming that data exists
- Don't use Zod `.default("http://placeholder")` as a safety net - it hides broken config
- Don't ship a feature and discover its dependencies via bug reports
