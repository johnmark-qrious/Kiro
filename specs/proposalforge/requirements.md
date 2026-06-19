# ProposalForge — Requirements Document

**Version:** 1.0
**Date:** 2026-05-29
**Status:** Draft

---

## 1. User Stories

### 1.1 Job Qualification Module

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| JQ-01 | As a freelancer, I want to see a quality score (0-100) on each Upwork job listing so I can quickly decide whether to invest connects. | Score appears as overlay badge within 2s of page load. Score is green (70-100), amber (40-69), or red (0-39). Score factors are visible on hover/click. |
| JQ-02 | As a freelancer, I want jobs scored on skills match against my profile so I don't waste time on irrelevant listings. | System compares job required skills against user's configured skill set. Match percentage shown. Jobs with <30% match flagged as "poor fit." |
| JQ-03 | As a freelancer, I want budget fit analysis so I know if the job pays what I'm worth. | System compares stated budget/hourly rate against user's configured minimum rate. Flags jobs below threshold. Shows "budget fit" indicator. |
| JQ-04 | As a freelancer, I want red flag detection so I avoid problematic clients. | System identifies: unverified payment, <50% hire rate, vague scope, unrealistic budget-to-scope ratio. Each red flag shown with explanation. |
| JQ-05 | As a freelancer, I want to configure my qualification criteria (skills, min rate, preferred categories) so scoring reflects my priorities. | Settings page allows: skill list management, minimum hourly/fixed rate, preferred job categories, custom red flag thresholds. Changes apply to next page load. |

### 1.2 Proposal Generation Module

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| PG-01 | As a freelancer, I want to generate a proposal draft for a specific job with one click so I save time writing. | "Generate Proposal" button appears on job listing. Clicking produces a draft within 8 seconds. Draft references specific job requirements. |
| PG-02 | As a freelancer, I want the generated proposal to incorporate relevant portfolio items so my experience is highlighted. | User configures portfolio items (title, description, URL). System selects 1-3 relevant items based on job skills/description match. |
| PG-03 | As a freelancer, I want to edit the generated proposal before submission so I maintain control. | Draft appears in editable text area. User can modify freely. "Copy to clipboard" button for pasting into Upwork. No auto-submission ever. |
| PG-04 | As a freelancer, I want proposal length to adapt to job budget tier so I don't over-invest in small jobs. | Jobs <$500: proposal ≤150 words. Jobs $500-$5000: 150-300 words. Jobs >$5000: 300-500 words. User can override. |
| PG-05 | As a freelancer, I want to regenerate with different tone/angle if the first draft doesn't fit. | "Regenerate" button with options: more technical, more casual, shorter, emphasize different skill. New draft in <8s. |

### 1.3 Style Engine Module

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| SE-01 | As a freelancer, I want the system to learn my writing style from my past proposals so generated text sounds like me. | User can paste 5+ past proposals. System extracts style markers (tone, structure, vocabulary). Style confidence score shown (0-100%). |
| SE-02 | As a freelancer, I want every edit I make to a generated proposal to improve future generations. | Edits are captured as training signals. After 20+ edits, generated proposals measurably shift toward user's editing patterns. |
| SE-03 | As a freelancer, I want to see a "style match" score on each generated proposal so I know how well it reflects my voice. | Each draft shows style match percentage. Score improves over time as model trains on more user data. |
| SE-04 | As a freelancer, I want to reset my style model if my writing approach changes. | "Reset style model" button in settings. Confirmation dialog. Model resets to baseline. Previous training data archived (not deleted). |

### 1.4 Pipeline Tracking Module

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| PT-01 | As a freelancer, I want every proposal I generate tracked with its outcome so I can see my pipeline. | Proposals auto-tracked when generated. Status: Draft → Sent → Viewed → Replied → Interviewed → Hired / Ghosted. |
| PT-02 | As a freelancer, I want to manually update proposal outcomes so my data stays accurate. | Each tracked proposal has status dropdown. User can update at any time. "Ghosted" auto-set after 14 days with no response (user can override). |
| PT-03 | As a freelancer, I want to see my win rate (proposals sent → hired) over time. | Dashboard shows: overall win rate, win rate by category, win rate by month. Minimum 10 proposals before showing rate. |
| PT-04 | As a freelancer, I want to see my connect ROI (connects spent vs revenue earned). | Dashboard shows: total connects spent, total revenue from hired proposals, cost-per-hire in connects, revenue per connect. |
| PT-05 | As a freelancer, I want to see my active pipeline (proposals awaiting response). | Pipeline view shows all proposals in Sent/Viewed/Replied status with days elapsed and expected response probability. |

### 1.5 A/B Testing Module

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| AB-01 | As a freelancer, I want the system to automatically vary proposal elements so I can discover what works. | After 20+ proposals, system introduces controlled variations: opening style, length, technical depth, CTA style. Variations tagged for tracking. |
| AB-02 | As a freelancer, I want to see which proposal styles convert better for me. | Insights page shows: conversion rate by opening style, by length bucket, by technical depth level. Minimum 50 proposals before showing insights. |
| AB-03 | As a freelancer, I want actionable recommendations based on my A/B data. | System generates natural-language insights: "Your proposals with code samples convert 2.5x better" with statistical confidence indicator. |
| AB-04 | As a freelancer, I want to opt out of A/B testing if I prefer consistency. | Toggle in settings: "Enable proposal experiments." Default: on. When off, system uses best-performing style only. |

### 1.6 Client Intelligence Module

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| CI-01 | As a freelancer, I want to see a client dossier before writing a proposal so I can assess the opportunity. | Client panel shows: hire rate, avg budget, review score given, repeat-hire %, payment verification status, account age. |
| CI-02 | As a freelancer, I want client red flags highlighted prominently. | Red flags (hire rate <30%, disputes, unverified payment, new account with large scope) shown in red with explanation. |
| CI-03 | As a freelancer, I want to see how clients compare to platform averages. | Each metric shows "vs platform avg" indicator (above/below/average). |
| CI-04 | As a freelancer, I want client data cached so repeat encounters load instantly. | Client data cached for 7 days. Cache invalidated on next visit to client's profile. Stale indicator shown if data >7 days old. |

### 1.7 Retainer Engine Module

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| RE-01 | As a freelancer, I want to be prompted to pitch retainer work after successful projects. | System triggers retainer suggestion when: project marked "Hired" + positive outcome + client has repeat-hire history >30%. |
| RE-02 | As a freelancer, I want a generated retainer pitch tailored to the completed project. | Retainer pitch references: completed work, potential ongoing needs (maintenance, features, support), suggested monthly hours. |
| RE-03 | As a freelancer, I want to dismiss retainer suggestions for specific clients. | "Don't suggest for this client" option. Persists permanently unless manually re-enabled. |

### 1.8 Account & Billing Module

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| AC-01 | As a freelancer, I want to sign up with just my email (magic link) so there's no password friction. | Email input → magic link sent → click → authenticated. Session lasts 30 days. Re-auth via new magic link. |
| AC-02 | As a freelancer, I want to choose a subscription tier (Starter/Pro/Agency) and pay monthly or annually. | Pricing page shows all tiers. Stripe checkout. Annual discount shown. Subscription active immediately after payment. |
| AC-03 | As a freelancer, I want to upgrade/downgrade my plan at any time. | Plan change takes effect at next billing cycle. Prorated credits for upgrades. Feature access adjusts immediately on upgrade. |
| AC-04 | As a freelancer, I want to export all my data (GDPR compliance). | "Export my data" button generates JSON/CSV download of all user data within 24 hours. |
| AC-05 | As a freelancer, I want to delete my account and all associated data. | "Delete account" with confirmation. All data purged within 30 days. Subscription cancelled. Confirmation email sent. |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Job score overlay render time | <2 seconds after page load | Chrome DevTools Performance tab |
| Proposal generation latency | <8 seconds (p95) | API response time monitoring |
| Dashboard page load | <1.5 seconds (LCP) | Lighthouse/Web Vitals |
| Extension memory footprint | <50MB | Chrome Task Manager |
| API response time (non-AI) | <200ms (p95) | Server-side metrics |

### 2.2 Security

| Requirement | Implementation |
|-------------|---------------|
| Data in transit | TLS 1.3 for all API communication |
| Data at rest | AES-256 encryption for proposal text and style models |
| Authentication | Magic link with short-lived tokens (15min link expiry, 30-day session) |
| API authorization | JWT with per-user scoping, no cross-user data access |
| Secrets management | Environment variables, never in client bundle |
| Extension permissions | Minimal: activeTab, storage, specific Upwork URL patterns only |

### 2.3 Privacy

| Requirement | Implementation |
|-------------|---------------|
| No Upwork credentials stored | Extension uses existing browser session cookies |
| Per-user data isolation | Row-level security, user_id on every table |
| GDPR Article 17 (right to erasure) | Full data deletion within 30 days of request |
| GDPR Article 20 (data portability) | JSON export of all user data |
| No cross-user data sharing | Style models and proposals never aggregated without explicit opt-in |
| Local-first where possible | Job scores computed client-side when feasible; raw DOM data never sent to server |

### 2.4 Availability

| Requirement | Target |
|-------------|--------|
| API uptime | 99.5% (allows ~3.6 hrs downtime/month) |
| Extension graceful degradation | Functions in read-only mode if API unreachable |
| Planned maintenance window | Sundays 02:00-04:00 UTC |
| Recovery Time Objective (RTO) | <1 hour |
| Recovery Point Objective (RPO) | <1 hour (database backups) |

### 2.5 Scalability

| Requirement | Target |
|-------------|--------|
| Concurrent users supported | 1,000 (sufficient for $300K ARR ceiling) |
| Database size per user | ~50MB (proposals, outcomes, style data) |
| AI API concurrent requests | 20 (rate-limited per user: 5 req/min) |
| Horizontal scaling trigger | >70% CPU sustained for 5 minutes |

---

## 3. Constraints

### 3.1 Technical Constraints

- **Chrome Manifest V3 only** — no Manifest V2 (deprecated). Service workers, not background pages.
- **No server-side scraping** — all Upwork data extracted client-side via DOM parsing in user's authenticated session.
- **No auto-submission** — proposals are never submitted programmatically. Human copies text and submits manually.
- **Solo founder maintenance** — architecture must be operable by one person. No complex orchestration.
- **AI token budget** — cost per user must stay under $4/month at Pro tier usage levels.

### 3.2 Legal Constraints

- **Upwork ToS compliance** — extension reads public page data in user's own session. Same model as Grammarly, LastPass, etc. No API abuse, no credential harvesting, no automated actions.
- **GDPR compliance** — required for EU users. Data portability, right to erasure, consent for data processing.
- **Chrome Web Store policies** — extension must declare all permissions, no remote code execution, clear privacy policy.
- **AI provider ToS** — no sending of third-party PII to AI APIs without user consent. Proposals may contain client names — user consents at signup.

### 3.3 Platform Constraints

- **Upwork DOM instability** — UI changes quarterly. Budget 4-16 hours/quarter for selector maintenance.
- **Chrome extension review** — initial review takes 1-3 business days. Updates reviewed within 24 hours.
- **Claude API rate limits** — Tier 1: 60 RPM, 60K tokens/min. Sufficient for <500 concurrent users.

### 3.4 Budget Constraints

- **Infrastructure budget:** <$500/month until 200+ paying users
- **AI API budget:** <$2,000/month until 500+ paying users
- **No external engineering** — founder builds everything
- **Marketing budget:** $0-500/month (organic-first)

---

## 4. Dependencies

| Dependency | Purpose | Risk Level | Fallback |
|------------|---------|------------|----------|
| **Claude API (Anthropic)** | Proposal generation, job scoring, style learning | Medium (API outages, pricing changes) | OpenAI GPT-4o as secondary provider |
| **Chrome Web Store** | Extension distribution | Low (stable platform) | Direct .crx distribution for existing users |
| **Stripe** | Subscription billing | Low (industry standard) | Lemon Squeezy as backup |
| **Vercel** | Dashboard hosting, serverless API | Low | Cloudflare Pages + Workers |
| **Neon/Supabase PostgreSQL** | Database | Low | Railway PostgreSQL |
| **Resend** | Magic link emails | Low | SendGrid |
| **Upwork DOM structure** | Job/client data extraction | High (changes quarterly) | Manual paste fallback mode |

---

## 5. Architecture Decision Records

### ADR-001: Browser Extension vs Server-Side Scraping

**Status:** Accepted
**Date:** 2026-05-29

#### Context

We need to extract job listing data and client information from Upwork. Two approaches: server-side scraping (headless browser or API reverse-engineering) or client-side DOM parsing via browser extension in the user's authenticated session.

#### Options Considered

**Option A: Server-side scraping**
- Pros: Centralized, no extension maintenance, works across browsers
- Cons: Violates Upwork ToS, requires credential storage, IP blocking risk, legal liability, Upwork actively detects and bans (23% more suspensions in 2025)

**Option B: Browser extension (client-side DOM parsing)**
- Pros: Uses user's own session (same as Grammarly), no credential storage, no ToS violation for reading page data, no server-side Upwork traffic
- Cons: DOM maintenance burden (4-16hrs/quarter), Chrome-only initially, extension review process

#### Decision

**Option B: Browser extension.** The legal and platform risk of server-side scraping is existential for a solo founder business. DOM maintenance is a bounded, budgetable operational cost.

#### Consequences

- Must maintain DOM selectors quarterly (budgeted)
- Must implement graceful degradation when selectors break
- Chrome-only at launch (90%+ of target market uses Chrome)
- Extension adds friction to onboarding (install step)

---

### ADR-002: AI Provider Selection

**Status:** Accepted
**Date:** 2026-05-29

#### Context

Need an LLM for proposal generation, style learning, and job scoring. Must produce high-quality, voice-consistent text at reasonable cost.

#### Options Considered

**Option A: Claude (Anthropic) — Sonnet as primary**
- Pros: Best at maintaining consistent voice/style, excellent instruction following, $3/$15 per MTok (Sonnet), strong at structured output
- Cons: Smaller ecosystem than OpenAI, fewer fine-tuning options

**Option B: OpenAI GPT-4o**
- Pros: Largest ecosystem, fine-tuning available, function calling mature
- Cons: More expensive for equivalent quality ($5/$15), less consistent at voice matching in testing

**Option C: Local models (Ollama/llama.cpp)**
- Pros: Zero API cost, full privacy, no rate limits
- Cons: Requires user to run local inference (non-starter for SaaS), quality insufficient for proposal generation

#### Decision

**Claude Sonnet as primary, OpenAI GPT-4o as fallback.** Claude's superior style consistency is the core product differentiator. Dual-provider prevents single-vendor lock-in.

#### Consequences

- Primary cost is Claude API ($3/$15 per MTok for Sonnet)
- Must abstract AI calls behind provider interface for easy switching
- Fallback to OpenAI if Claude has outage (automatic, transparent to user)
- Style model prompts must work across both providers

---

### ADR-003: Data Storage Strategy (Per-User Isolation)

**Status:** Accepted
**Date:** 2026-05-29

#### Context

User data includes proposals (potentially sensitive business communications), style models, client intelligence, and outcome tracking. Must ensure strict per-user isolation and GDPR compliance.

#### Options Considered

**Option A: Shared PostgreSQL with row-level security (RLS)**
- Pros: Simple ops, single database, RLS enforces isolation at DB level, standard tooling
- Cons: Misconfigured RLS = data leak, all data in one place

**Option B: Per-user SQLite databases**
- Pros: Physical isolation, easy export/deletion, no cross-contamination possible
- Cons: Complex ops at scale, no cross-user queries, backup complexity

**Option C: Shared PostgreSQL with application-level isolation**
- Pros: Simple queries, standard patterns
- Cons: Isolation depends on application code correctness, easier to introduce bugs

#### Decision

**Option A: Shared PostgreSQL with RLS.** At lifestyle-business scale (≤1,500 users), a single well-configured PostgreSQL instance with RLS provides strong isolation with minimal operational complexity. Every table has `user_id` column with RLS policy.

#### Consequences

- All tables include `user_id` column, enforced by RLS policies
- API layer sets `current_user_id` session variable on every request
- Data export = `SELECT * FROM each_table WHERE user_id = ?`
- Data deletion = `DELETE FROM each_table WHERE user_id = ?`
- Must test RLS policies as part of CI

---

### ADR-004: Style Learning Approach

**Status:** Accepted
**Date:** 2026-05-29

#### Context

The core differentiator is generating proposals that sound like the user. Need a mechanism to learn and replicate individual writing style without fine-tuning (too expensive per user).

#### Options Considered

**Option A: Per-user fine-tuned model**
- Pros: Best quality, model truly learns the style
- Cons: $25+ per user to fine-tune, retraining on every new sample, not viable at $29-99/mo price point

**Option B: Few-shot prompting with style examples**
- Pros: Zero training cost, instant "learning" from pasted examples, works with any LLM, easy to update
- Cons: Limited by context window, style consistency degrades with fewer examples

**Option C: Style descriptor extraction + few-shot hybrid**
- Pros: Extracts reusable style attributes (tone, structure, vocabulary patterns) stored as compact descriptor. Combined with 2-3 best examples in prompt. Compact, effective, updatable.
- Cons: Requires initial extraction step, descriptor quality depends on sample quality

#### Decision

**Option C: Style descriptor + few-shot hybrid.** Extract a structured style profile (JSON: tone, formality, structure patterns, vocabulary preferences, opening/closing patterns) from user's samples. Store as compact descriptor (~500 tokens). Include descriptor + 2-3 best examples in generation prompt. Update descriptor incrementally as user edits proposals.

#### Consequences

- Style model stored as JSON blob (~2KB per user)
- Initial style extraction requires 5+ sample proposals from user
- Each generation prompt includes: style descriptor + 2-3 examples + job context (~2,000 tokens overhead)
- Edits captured and periodically re-extract style descriptor (batch, async)
- No per-user fine-tuning cost

---

### ADR-005: Subscription Billing

**Status:** Accepted
**Date:** 2026-05-29

#### Context

Need subscription billing for 3 tiers (Starter/Pro/Agency) with monthly and annual options. Must handle upgrades, downgrades, cancellations, and failed payments.

#### Options Considered

**Option A: Stripe**
- Pros: Industry standard, excellent docs, handles tax (Stripe Tax), 2.9% + $0.30 per transaction, robust webhooks, Customer Portal for self-service
- Cons: More complex integration than alternatives, US entity preferred

**Option B: Lemon Squeezy**
- Pros: Merchant of record (handles global tax/VAT), simpler integration, built for indie devs
- Cons: Higher fees (5% + $0.50), less control, fewer features, smaller ecosystem

**Option C: Paddle**
- Pros: Merchant of record, handles tax globally, good for SaaS
- Cons: Higher fees (5% + $0.50), approval process, less flexible

#### Decision

**Option A: Stripe.** Lower fees at scale (saves ~$2,000/year at 500 users vs Lemon Squeezy). Stripe Tax handles VAT. Customer Portal eliminates building billing UI. Mature webhooks for subscription lifecycle events.

#### Consequences

- Must register for Stripe Tax to handle EU VAT
- Implement webhook handlers for: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Use Stripe Customer Portal for plan changes (no custom billing UI needed)
- 2.9% + $0.30 per transaction = ~$1.74 per $59 subscription

---

### ADR-006: DOM Maintenance Strategy

**Status:** Accepted
**Date:** 2026-05-29

#### Context

Upwork changes their frontend UI periodically (estimated quarterly). When DOM structure changes, extension selectors break and data extraction fails. Need a strategy to detect, respond, and minimize user impact.

#### Options Considered

**Option A: Fragile selectors with fast manual fixes**
- Pros: Simple implementation, works until it doesn't
- Cons: Users experience breakage before fix ships, reactive only

**Option B: Resilient selector strategy with automated detection**
- Pros: Multiple selector fallbacks (data attributes → aria labels → structural position → text content), automated health checks detect breaks before users report, graceful degradation to manual mode
- Cons: More complex initial implementation, still requires manual fix for major redesigns

**Option C: Official Upwork API (if available)**
- Pros: Stable contract, no DOM dependency
- Cons: Upwork has no public API for job listing data extraction at this level. Not an option.

#### Decision

**Option B: Resilient selectors with automated detection.** Each data point has a priority-ordered list of selectors. Automated daily health check (headless browser visits Upwork, validates selectors). Alert on failure. Graceful degradation: if extraction fails, show "manual paste" mode instead of broken data.

#### Consequences

- Each extracted field has 3-4 fallback selectors (primary → secondary → structural → text-based)
- Daily automated check runs against live Upwork (single page load, validates selector presence)
- Alert to founder on selector failure (PagerDuty/email)
- Extension shows "Data extraction unavailable — paste job details manually" when selectors fail
- Budget: 4-16 hours/quarter for selector updates
- Extension auto-updates via Chrome Web Store (24hr review for updates)

---
