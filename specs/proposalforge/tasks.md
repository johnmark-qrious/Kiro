# ProposalForge — Task Breakdown

**Version:** 1.0
**Date:** 2026-05-29
**Produced by:** @taskmaster

---

## Phase 1: MVP (Core Loop — Score + Generate + Copy)
**Estimated effort:** 28 days
**Infra cost:** $150/month (AI API dominant)

> Goal: A working Chrome extension that scores Upwork jobs and generates proposals. No dashboard, no billing, no style engine. Free beta for first 50 users.

---

### Task 1.1: Project Scaffold — Next.js API + Extension Monorepo
**Effort:** 1 day
**Depends on:** none
**Files:**
- `package.json` (create)
- `turbo.json` (create)
- `apps/web/package.json` (create)
- `apps/web/next.config.ts` (create)
- `apps/web/tsconfig.json` (create)
- `apps/extension/package.json` (create)
- `apps/extension/vite.config.ts` (create)
- `apps/extension/tsconfig.json` (create)
- `apps/extension/manifest.json` (create)
- `packages/shared/package.json` (create)
- `packages/shared/src/types.ts` (create)
- `.gitignore` (create)
- `.env.example` (create)

**Acceptance Criteria:**
- [ ] `bun install` succeeds from root
- [ ] `bun run build` builds both apps/web and apps/extension without errors
- [ ] Extension loads in Chrome via `chrome://extensions` (developer mode) without errors
- [ ] Next.js dev server starts and responds at localhost:3000
- [ ] Shared package types importable from both apps

---

### Task 1.2: Database Schema + RLS Policies
**Effort:** 2 days
**Depends on:** 1.1
**Files:**
- `apps/web/drizzle.config.ts` (create)
- `apps/web/src/db/schema/users.ts` (create)
- `apps/web/src/db/schema/jobs.ts` (create)
- `apps/web/src/db/schema/clients.ts` (create)
- `apps/web/src/db/schema/proposals.ts` (create)
- `apps/web/src/db/schema/outcomes.ts` (create)
- `apps/web/src/db/schema/portfolio-items.ts` (create)
- `apps/web/src/db/schema/user-skills.ts` (create)
- `apps/web/src/db/schema/index.ts` (create)
- `apps/web/src/db/index.ts` (create)
- `apps/web/src/db/migrations/0001_initial.sql` (create)
- `apps/web/src/db/rls-policies.sql` (create)

**Acceptance Criteria:**
- [ ] `drizzle-kit push` applies schema to Neon database without errors
- [ ] All tables have `user_id` column with NOT NULL constraint
- [ ] RLS enabled on all tables with `user_isolation` policy
- [ ] Test: inserting row as user A, querying as user B returns empty result
- [ ] Indexes created for: `proposals(user_id, status)`, `jobs(user_id, score)`, `clients(user_id, upwork_client_id)`

---

### Task 1.3: Authentication — Magic Link Flow
**Effort:** 2 days
**Depends on:** 1.2
**Files:**
- `apps/web/src/app/api/auth/magic-link/route.ts` (create)
- `apps/web/src/app/api/auth/verify/route.ts` (create)
- `apps/web/src/lib/auth/jwt.ts` (create)
- `apps/web/src/lib/auth/middleware.ts` (create)
- `apps/web/src/lib/email/resend.ts` (create)
- `apps/web/src/lib/email/templates/magic-link.tsx` (create)
- `apps/web/src/db/schema/magic-links.ts` (create)
- `apps/web/src/app/api/auth/me/route.ts` (create)

**Acceptance Criteria:**
- [ ] POST `/api/auth/magic-link` with valid email sends email via Resend and returns 200
- [ ] Magic link token expires after 15 minutes
- [ ] GET `/api/auth/verify?token=xxx` with valid token returns JWT (30-day expiry)
- [ ] Used tokens cannot be reused (returns 401)
- [ ] GET `/api/auth/me` with valid JWT returns user object
- [ ] GET `/api/auth/me` without JWT returns 401
- [ ] New user auto-created on first magic link verification

---

### Task 1.4: Extension Auth — Login Flow + Token Storage
**Effort:** 1 day
**Depends on:** 1.3
**Files:**
- `apps/extension/src/popup/App.tsx` (create)
- `apps/extension/src/popup/Login.tsx` (create)
- `apps/extension/src/popup/Dashboard.tsx` (create)
- `apps/extension/src/background/auth.ts` (create)
- `apps/extension/src/lib/storage.ts` (create)
- `apps/extension/src/lib/api-client.ts` (create)
- `apps/extension/popup.html` (create)

**Acceptance Criteria:**
- [ ] Extension popup shows login form when no token stored
- [ ] User enters email → magic link sent → user clicks link → extension receives and stores JWT
- [ ] Subsequent popup opens show "logged in" state with user email
- [ ] API client attaches Bearer token to all requests
- [ ] Token refresh: if API returns 401, extension shows re-login prompt

---

### Task 1.5: User Settings — Skills, Rate, Preferences
**Effort:** 1.5 days
**Depends on:** 1.3
**Files:**
- `apps/web/src/app/api/settings/route.ts` (create)
- `apps/web/src/app/api/settings/skills/route.ts` (create)
- `apps/extension/src/popup/Settings.tsx` (create)
- `packages/shared/src/schemas/settings.ts` (create)

**Acceptance Criteria:**
- [ ] GET `/api/settings` returns user's current settings (skills, min rate, categories)
- [ ] PUT `/api/settings` updates settings with Zod validation
- [ ] Extension popup has Settings tab with: skill list (add/remove), minimum hourly rate input, preferred categories multi-select
- [ ] Changes persist across extension restarts (stored server-side)
- [ ] Invalid inputs (negative rate, empty skill name) rejected with 400

---

### Task 1.6: DOM Parser — Job Listing Data Extraction
**Effort:** 2 days
**Depends on:** 1.1
**Files:**
- `apps/extension/src/content/selectors.ts` (create)
- `apps/extension/src/content/parser.ts` (create)
- `apps/extension/src/content/extractor.ts` (create)
- `apps/extension/src/content/job-list.ts` (create)
- `apps/extension/src/content/job-detail.ts` (create)
- `apps/extension/src/content/__tests__/parser.test.ts` (create)
- `apps/extension/src/content/__tests__/fixtures/job-listing.html` (create)
- `apps/extension/src/content/__tests__/fixtures/job-detail.html` (create)

**Acceptance Criteria:**
- [ ] Content script activates on `upwork.com/nx/find-work/*` and `upwork.com/jobs/*`
- [ ] Extracts: job title, description, required skills, budget type/amount, proposal count range
- [ ] Extracts client data: name, hire rate, total spent, payment verified, country
- [ ] Each field uses priority-ordered selector chain (3+ fallbacks)
- [ ] Returns null for fields that can't be extracted (no crashes)
- [ ] Unit tests pass against saved HTML fixture files
- [ ] MutationObserver detects dynamically loaded job cards

---

### Task 1.7: Job Scoring API + AI Integration
**Effort:** 2 days
**Depends on:** 1.2, 1.5
**Files:**
- `apps/web/src/app/api/jobs/score/route.ts` (create)
- `apps/web/src/lib/ai/provider.ts` (create)
- `apps/web/src/lib/ai/claude.ts` (create)
- `apps/web/src/lib/ai/openai.ts` (create)
- `apps/web/src/lib/ai/prompts/job-scoring.ts` (create)
- `apps/web/src/lib/ai/failover.ts` (create)
- `packages/shared/src/schemas/job-score.ts` (create)

**Acceptance Criteria:**
- [ ] POST `/api/jobs/score` accepts extracted job data and returns score 0-100 with tier (green/amber/red)
- [ ] Response includes breakdown: skills_match, budget_fit, client_quality, competition, red_flags
- [ ] Response includes client_dossier with hire_rate_vs_avg indicator
- [ ] Latency <2s (p95) for scoring endpoint
- [ ] If Claude API fails, automatically falls back to OpenAI
- [ ] Rate limited: 30 requests/minute per user
- [ ] Job + score cached in database (no re-scoring same job within 24hrs)

---

### Task 1.8: Score Badge — Extension UI Overlay
**Effort:** 1.5 days
**Depends on:** 1.6, 1.7
**Files:**
- `apps/extension/src/content/ui/score-badge.ts` (create)
- `apps/extension/src/content/ui/score-breakdown.ts` (create)
- `apps/extension/src/content/ui/styles.css` (create)
- `apps/extension/src/background/messaging.ts` (create)
- `apps/extension/src/content/orchestrator.ts` (create)

**Acceptance Criteria:**
- [ ] Score badge (colored circle + number) appears next to each job title within 2s of page load
- [ ] Badge color: green (70-100), amber (40-69), red (0-39)
- [ ] Clicking badge expands to show score breakdown + client dossier
- [ ] Badge does not break Upwork page layout (positioned via CSS, no DOM displacement)
- [ ] Scores cached locally — revisiting same job shows cached score instantly
- [ ] If scoring fails, badge shows "?" with "unable to score" tooltip

---

### Task 1.9: Proposal Generation API
**Effort:** 2 days
**Depends on:** 1.7
**Files:**
- `apps/web/src/app/api/proposals/generate/route.ts` (create)
- `apps/web/src/app/api/proposals/[id]/route.ts` (create)
- `apps/web/src/app/api/proposals/[id]/regenerate/route.ts` (create)
- `apps/web/src/lib/ai/prompts/proposal-generation.ts` (create)
- `packages/shared/src/schemas/proposal.ts` (create)

**Acceptance Criteria:**
- [ ] POST `/api/proposals/generate` returns proposal text within 8s (p95)
- [ ] Generated proposal references specific job requirements from the listing
- [ ] Proposal length adapts to budget tier: <$500 → ≤150 words, $500-$5000 → 150-300, >$5000 → 300-500
- [ ] POST `/api/proposals/:id/regenerate` with adjustment (more_technical, shorter, etc.) returns new draft
- [ ] PUT `/api/proposals/:id` updates final_text and status
- [ ] Rate limited: 5 generation requests/minute per user
- [ ] Proposal stored in database with tokens_used tracking

---

### Task 1.10: Proposal Panel — Extension UI
**Effort:** 2 days
**Depends on:** 1.8, 1.9
**Files:**
- `apps/extension/src/content/ui/proposal-panel.ts` (create)
- `apps/extension/src/content/ui/editor.ts` (create)
- `apps/extension/src/content/ui/generate-button.ts` (create)
- `apps/extension/src/content/ui/panel-styles.css` (create)

**Acceptance Criteria:**
- [ ] "Generate Proposal" button appears on job detail pages near Upwork's submit area
- [ ] Clicking opens slide-in panel with loading state
- [ ] Generated proposal appears in editable textarea
- [ ] "Copy to Clipboard" button copies text and shows confirmation
- [ ] "Regenerate" button with dropdown: more technical, more casual, shorter, emphasize different skill
- [ ] Panel does NOT auto-submit anything to Upwork
- [ ] Panel closeable, re-openable without losing draft

---

### Task 1.11: Portfolio Items CRUD
**Effort:** 1 day
**Depends on:** 1.3
**Files:**
- `apps/web/src/app/api/portfolio/route.ts` (create)
- `apps/web/src/app/api/portfolio/[id]/route.ts` (create)
- `apps/extension/src/popup/Portfolio.tsx` (create)

**Acceptance Criteria:**
- [ ] GET `/api/portfolio` returns user's portfolio items
- [ ] POST `/api/portfolio` creates item (title, description, URL, skills)
- [ ] PUT `/api/portfolio/:id` updates item
- [ ] DELETE `/api/portfolio/:id` removes item
- [ ] Extension popup has Portfolio tab with add/edit/delete UI
- [ ] Proposal generation selects 1-3 relevant portfolio items based on skill match to job

---

### Task 1.12: Graceful Degradation + Manual Paste Mode
**Effort:** 1 day
**Depends on:** 1.6, 1.10
**Files:**
- `apps/extension/src/content/ui/manual-paste.ts` (create)
- `apps/extension/src/content/health-check.ts` (create)
- `apps/extension/src/background/selector-overrides.ts` (create)

**Acceptance Criteria:**
- [ ] When DOM extraction fails for core fields (title, description), manual paste textarea shown
- [ ] User can paste job text → scoring and generation still work from pasted content
- [ ] Extension fetches selector overrides from API on startup (hotfix path)
- [ ] Partial extraction (some fields missing) shows score with "incomplete data" badge
- [ ] No crashes or blank screens when selectors break

---

### Task 1.13: CI/CD Pipeline
**Effort:** 1.5 days
**Depends on:** 1.1
**Files:**
- `.github/workflows/ci.yml` (create)
- `.github/workflows/extension-release.yml` (create)
- `apps/extension/scripts/build-prod.ts` (create)

**Acceptance Criteria:**
- [ ] Push to any branch triggers: lint (ESLint), typecheck (tsc --noEmit), test (vitest run)
- [ ] Push to `main` triggers Vercel production deploy
- [ ] Extension release workflow: builds extension, creates zip, uploads to Chrome Web Store (manual trigger)
- [ ] CI fails if any lint error, type error, or test failure
- [ ] Build completes in <3 minutes

---

### Task 1.14: Extension Packaging + Chrome Web Store Submission
**Effort:** 1.5 days
**Depends on:** 1.10, 1.13
**Files:**
- `apps/extension/icons/16.png` (create)
- `apps/extension/icons/48.png` (create)
- `apps/extension/icons/128.png` (create)
- `apps/extension/PRIVACY_POLICY.md` (create)
- `docs/chrome-web-store-listing.md` (create)

**Acceptance Criteria:**
- [ ] Extension builds to production zip with all assets
- [ ] Manifest declares only required permissions: storage, activeTab, alarms, host_permissions for upwork.com
- [ ] Privacy policy covers: what data is collected, how it's used, AI processing consent
- [ ] Store listing has: description, screenshots (3+), category, privacy policy URL
- [ ] Extension passes Chrome Web Store automated review (no remote code execution, no excessive permissions)
- [ ] Successfully submitted and approved on Chrome Web Store

---

### Task 1.15: Basic Error Handling + Rate Limit Responses
**Effort:** 1 day
**Depends on:** 1.7, 1.9
**Files:**
- `apps/web/src/lib/errors.ts` (create)
- `apps/web/src/lib/rate-limit.ts` (create)
- `apps/web/src/middleware.ts` (create)
- `apps/extension/src/content/ui/error-toast.ts` (create)

**Acceptance Criteria:**
- [ ] All API errors return consistent format: `{ error: { code, message, details } }`
- [ ] Rate limit exceeded returns 429 with `Retry-After` header
- [ ] Extension shows user-friendly error toast (not raw error messages)
- [ ] Network failures show "offline" indicator with retry button
- [ ] AI provider timeout (>10s) returns graceful error, not 500

---

### Task 1.16: End-to-End Integration Test
**Effort:** 2 days
**Depends on:** 1.10, 1.12
**Files:**
- `tests/e2e/setup.ts` (create)
- `tests/e2e/auth-flow.test.ts` (create)
- `tests/e2e/job-scoring.test.ts` (create)
- `tests/e2e/proposal-generation.test.ts` (create)
- `tests/e2e/fixtures/upwork-job-page.html` (create)
- `playwright.config.ts` (create)

**Acceptance Criteria:**
- [ ] E2E test: extension loads → user logs in → navigates to fixture page → score badge appears
- [ ] E2E test: click generate → proposal panel opens → text appears → copy works
- [ ] E2E test: manual paste mode works when selectors fail
- [ ] E2E test: regenerate with different tone produces different output
- [ ] All tests pass in CI (GitHub Actions with Chrome headless)
- [ ] Tests use mocked AI responses (no real API calls in CI)



---

## Phase 2: V1.0 (Style Engine + Analytics + Pipeline)
**Estimated effort:** 24 days
**Infra cost:** $669/month (at ~200 users)

> Goal: Style learning makes proposals sound like the user. Pipeline tracking shows ROI. Dashboard provides analytics. Billing gates features by tier.

---

### Task 2.1: Style Model — Sample Ingestion + Extraction
**Effort:** 2 days
**Depends on:** 1.9
**Files:**
- `apps/web/src/app/api/style/samples/route.ts` (create)
- `apps/web/src/app/api/style/route.ts` (create)
- `apps/web/src/lib/ai/prompts/style-extraction.ts` (create)
- `apps/web/src/db/schema/style-models.ts` (create)
- `packages/shared/src/schemas/style.ts` (create)

**Acceptance Criteria:**
- [ ] POST `/api/style/samples` accepts array of past proposal texts
- [ ] After 5+ samples submitted, style extraction runs and produces style descriptor JSON
- [ ] Style descriptor includes: tone, formality, opening_pattern, closing_pattern, vocabulary_level, structure, unique_phrases, avoids
- [ ] Confidence score calculated (0-100%) based on sample count and consistency
- [ ] GET `/api/style` returns current style model with confidence score
- [ ] Rate limited: 10 submissions/hour

---

### Task 2.2: Style-Aware Proposal Generation
**Effort:** 1.5 days
**Depends on:** 2.1
**Files:**
- `apps/web/src/lib/ai/prompts/proposal-generation.ts` (modify)
- `apps/web/src/app/api/proposals/generate/route.ts` (modify)

**Acceptance Criteria:**
- [ ] Proposal generation prompt includes style descriptor + 2-3 best sample proposals
- [ ] Generated proposals include `style_match_score` (0-1.0) in response
- [ ] If no style model exists, generation works without style (baseline mode)
- [ ] Style match score visible in extension proposal panel
- [ ] Proposals with style model enabled are measurably different in tone from baseline

---

### Task 2.3: Style Learning from Edits
**Effort:** 2 days
**Depends on:** 2.1
**Files:**
- `apps/web/src/app/api/proposals/[id]/edit-signal/route.ts` (create)
- `apps/web/src/lib/style/edit-tracker.ts` (create)
- `apps/web/src/lib/style/re-extraction.ts` (create)
- `apps/extension/src/content/ui/editor.ts` (modify)

**Acceptance Criteria:**
- [ ] When user edits a generated proposal and copies/sends it, the diff is captured as edit signal
- [ ] Edit signals stored in database with original and final text
- [ ] After 20+ edit signals accumulated, style model re-extraction triggered (async)
- [ ] Re-extraction incorporates edit patterns into updated style descriptor
- [ ] Style model `updated_at` timestamp reflects latest re-extraction
- [ ] "Reset style model" button in settings archives current model and starts fresh

---

### Task 2.4: Pipeline Tracking — Auto-Track Proposals
**Effort:** 1.5 days
**Depends on:** 1.9
**Files:**
- `apps/web/src/app/api/proposals/route.ts` (create)
- `apps/web/src/app/api/outcomes/[proposalId]/route.ts` (create)
- `apps/web/src/lib/pipeline/ghosted-detector.ts` (create)
- `packages/shared/src/schemas/outcome.ts` (create)

**Acceptance Criteria:**
- [ ] Every generated proposal auto-tracked with status "draft"
- [ ] When user marks proposal as sent (PUT status), status updates to "sent"
- [ ] PATCH `/api/outcomes/:proposalId` allows manual status update (viewed, replied, interviewed, hired, ghosted)
- [ ] Vercel cron job runs daily: proposals in "sent" status for 14+ days auto-set to "ghosted" (user can override)
- [ ] GET `/api/proposals?status=sent,viewed,replied` returns active pipeline with days_elapsed

---

### Task 2.5: Web Dashboard — Layout + Auth
**Effort:** 2 days
**Depends on:** 1.3
**Files:**
- `apps/web/src/app/(dashboard)/layout.tsx` (create)
- `apps/web/src/app/(dashboard)/page.tsx` (create)
- `apps/web/src/app/(auth)/login/page.tsx` (create)
- `apps/web/src/app/(auth)/verify/page.tsx` (create)
- `apps/web/src/components/nav/sidebar.tsx` (create)
- `apps/web/src/components/nav/header.tsx` (create)
- `apps/web/src/lib/auth/session.ts` (create)
- `apps/web/tailwind.config.ts` (create)
- `apps/web/src/app/globals.css` (create)

**Acceptance Criteria:**
- [ ] Dashboard accessible at `/` with sidebar navigation (Pipeline, Analytics, Settings, Style)
- [ ] Unauthenticated users redirected to `/login`
- [ ] Login page: email input → magic link sent → verify page confirms auth
- [ ] Session persists via HTTP-only cookie (30-day expiry)
- [ ] Responsive layout: sidebar collapses on mobile
- [ ] LCP <1.5s on dashboard page load

---

### Task 2.6: Dashboard — Pipeline View
**Effort:** 2 days
**Depends on:** 2.4, 2.5
**Files:**
- `apps/web/src/app/(dashboard)/pipeline/page.tsx` (create)
- `apps/web/src/components/pipeline/proposal-card.tsx` (create)
- `apps/web/src/components/pipeline/status-columns.tsx` (create)
- `apps/web/src/components/pipeline/status-dropdown.tsx` (create)

**Acceptance Criteria:**
- [ ] Pipeline page shows proposals grouped by status (Sent, Viewed, Replied, Interviewed)
- [ ] Each proposal card shows: job title, client name, days elapsed, score
- [ ] Status dropdown allows manual update (triggers PATCH to outcomes API)
- [ ] "Ghosted" proposals shown in separate collapsed section
- [ ] "Hired" proposals shown with contract value
- [ ] Empty state shown when no proposals tracked yet

---

### Task 2.7: Dashboard — Analytics Summary
**Effort:** 2 days
**Depends on:** 2.4, 2.5
**Files:**
- `apps/web/src/app/(dashboard)/analytics/page.tsx` (create)
- `apps/web/src/app/api/analytics/summary/route.ts` (create)
- `apps/web/src/components/analytics/stat-card.tsx` (create)
- `apps/web/src/components/analytics/win-rate-chart.tsx` (create)
- `apps/web/src/components/analytics/connect-roi.tsx` (create)

**Acceptance Criteria:**
- [ ] GET `/api/analytics/summary?period=30d` returns: proposals_sent, win_rate, connects_spent, connects_per_hire, revenue_from_hires, revenue_per_connect
- [ ] Analytics page shows stat cards for each metric
- [ ] Win rate only shown after 10+ proposals (otherwise "not enough data" message)
- [ ] Period selector: 7d, 30d, 90d, all-time
- [ ] Win rate by category breakdown shown as bar chart
- [ ] Connect ROI section shows cost-per-hire and revenue-per-connect

---

### Task 2.8: Dashboard — Settings + Style Management
**Effort:** 1.5 days
**Depends on:** 2.1, 2.5
**Files:**
- `apps/web/src/app/(dashboard)/settings/page.tsx` (create)
- `apps/web/src/app/(dashboard)/settings/style/page.tsx` (create)
- `apps/web/src/components/settings/skills-editor.tsx` (create)
- `apps/web/src/components/settings/style-samples.tsx` (create)
- `apps/web/src/components/settings/style-confidence.tsx` (create)

**Acceptance Criteria:**
- [ ] Settings page: edit skills, min rate, preferred categories (mirrors extension popup settings)
- [ ] Style page: paste past proposals (textarea), see sample count, confidence score
- [ ] Style descriptor shown as readable summary ("Your tone: professional-friendly, formality: moderate...")
- [ ] "Reset style model" button with confirmation dialog
- [ ] After reset, confidence drops to 0% and user prompted to add new samples

---

### Task 2.9: Client Intelligence — Dossier + Red Flags
**Effort:** 1.5 days
**Depends on:** 1.7
**Files:**
- `apps/web/src/app/api/clients/[id]/route.ts` (create)
- `apps/web/src/lib/client/red-flags.ts` (create)
- `apps/extension/src/content/ui/client-dossier.ts` (create)

**Acceptance Criteria:**
- [ ] Client data cached in database with 7-day TTL
- [ ] Client dossier panel in extension shows: hire rate, avg budget, review score, repeat-hire %, payment status, account age
- [ ] Red flags highlighted in red: hire rate <30%, unverified payment, disputes, new account + large scope
- [ ] Each metric shows "vs platform avg" indicator (above/below/average)
- [ ] Stale data (>7 days) shows "data may be outdated" indicator
- [ ] Client dossier accessible from score badge expansion

---

### Task 2.10: Subscription Billing — Stripe Integration
**Effort:** 3 days
**Depends on:** 1.3
**Files:**
- `apps/web/src/app/api/billing/checkout/route.ts` (create)
- `apps/web/src/app/api/billing/portal/route.ts` (create)
- `apps/web/src/app/api/billing/webhook/route.ts` (create)
- `apps/web/src/lib/billing/stripe.ts` (create)
- `apps/web/src/lib/billing/plans.ts` (create)
- `apps/web/src/db/schema/subscriptions.ts` (create)
- `apps/web/src/app/(marketing)/pricing/page.tsx` (create)
- `apps/web/src/lib/auth/middleware.ts` (modify)

**Acceptance Criteria:**
- [ ] POST `/api/billing/checkout` creates Stripe Checkout session and returns URL
- [ ] Three tiers: Starter ($29/mo), Pro ($59/mo), Agency ($99/mo) with annual discount (20%)
- [ ] Webhook handles: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] GET `/api/billing/portal` returns Stripe Customer Portal URL for self-service plan changes
- [ ] Auth middleware checks subscription status — free tier gets limited access (50 scores/mo, 10 proposals/mo)
- [ ] Pricing page shows tier comparison with feature matrix
- [ ] Subscription status stored in database, checked on every API request

---

### Task 2.11: Feature Gating by Plan Tier
**Effort:** 1 day
**Depends on:** 2.10
**Files:**
- `apps/web/src/lib/billing/feature-gate.ts` (create)
- `apps/web/src/lib/billing/usage-tracker.ts` (create)
- `apps/web/src/app/api/billing/usage/route.ts` (create)
- `apps/extension/src/background/usage.ts` (create)

**Acceptance Criteria:**
- [ ] Starter: 50 job scores/month, 10 proposals/month, no style engine, no A/B testing
- [ ] Pro: unlimited scores, unlimited proposals, style engine, A/B testing, analytics
- [ ] Agency: everything in Pro + priority support + data export
- [ ] Usage tracked per billing period, resets on renewal
- [ ] Extension shows usage remaining in popup ("8/10 proposals used this month")
- [ ] API returns 403 with `PLAN_LIMIT_EXCEEDED` when limit hit

---

### Task 2.12: DOM Health Check Cron Job
**Effort:** 1.5 days
**Depends on:** 1.6
**Files:**
- `apps/web/src/app/api/cron/dom-health/route.ts` (create)
- `apps/web/src/app/api/extension/selectors/route.ts` (create)
- `apps/web/src/lib/monitoring/dom-health.ts` (create)
- `apps/web/src/lib/monitoring/alerts.ts` (create)
- `vercel.json` (create/modify)

**Acceptance Criteria:**
- [ ] Cron job runs daily at 06:00 UTC via Vercel Cron
- [ ] Checks selector presence against known Upwork job page (Playwright/Puppeteer)
- [ ] If any selector chain fully fails, sends alert email to founder
- [ ] GET `/api/extension/selectors` returns any hotfix selector overrides
- [ ] Extension fetches overrides on startup and merges into local registry
- [ ] Health check results logged for trend analysis

---

### Task 2.13: GDPR Compliance — Export + Delete
**Effort:** 1.5 days
**Depends on:** 2.5
**Files:**
- `apps/web/src/app/api/account/export/route.ts` (create)
- `apps/web/src/app/api/account/delete/route.ts` (create)
- `apps/web/src/app/(dashboard)/settings/account/page.tsx` (create)
- `apps/web/src/lib/gdpr/export.ts` (create)
- `apps/web/src/lib/gdpr/delete.ts` (create)

**Acceptance Criteria:**
- [ ] GET `/api/account/export` generates JSON file with all user data (proposals, outcomes, style model, settings, portfolio)
- [ ] Export completes within 30 seconds for typical user (<1000 proposals)
- [ ] DELETE `/api/account` with confirmation token: cancels subscription, queues data deletion
- [ ] Data fully purged within 30 days (cron job processes deletion queue)
- [ ] Confirmation email sent on both export and delete
- [ ] Account page shows "Export my data" and "Delete account" buttons with appropriate warnings



---

## Phase 3: V1.5 (A/B Testing + Retainer Engine + Polish)
**Estimated effort:** 18 days
**Infra cost:** $1,688/month (at ~500 users)

> Goal: Automated proposal experimentation, retainer upsell engine, and production hardening. Full feature set as described in requirements.

---

### Task 3.1: A/B Testing — Variant Tagging
**Effort:** 2 days
**Depends on:** 2.2, 2.4
**Files:**
- `apps/web/src/lib/ab/variant-engine.ts` (create)
- `apps/web/src/lib/ai/prompts/proposal-generation.ts` (modify)
- `apps/web/src/db/schema/proposal-variants.ts` (create)
- `apps/web/src/app/api/proposals/generate/route.ts` (modify)

**Acceptance Criteria:**
- [ ] After user has 20+ proposals, system introduces controlled variations in generation
- [ ] Variations tagged: opening_style (hook/question/direct), length_bucket, technical_depth, cta_style
- [ ] Each proposal stores its variant_tag in database
- [ ] Variant selection is balanced (roughly equal distribution across options)
- [ ] User can opt out via settings toggle ("Enable proposal experiments")
- [ ] When opted out, system uses best-performing variant only

---

### Task 3.2: A/B Testing — Insights API + Dashboard
**Effort:** 2 days
**Depends on:** 3.1, 2.7
**Files:**
- `apps/web/src/app/api/analytics/ab-insights/route.ts` (create)
- `apps/web/src/lib/ab/insights-calculator.ts` (create)
- `apps/web/src/app/(dashboard)/analytics/insights/page.tsx` (create)
- `apps/web/src/components/analytics/insight-card.tsx` (create)

**Acceptance Criteria:**
- [ ] GET `/api/analytics/ab-insights` returns conversion rate by variant type
- [ ] Insights only shown after 50+ proposals (otherwise "collecting data" message)
- [ ] Each insight includes: finding (natural language), confidence score, sample size, recommendation
- [ ] Example insight: "Technical openings convert 2.3x better for you (87% confidence, n=67)"
- [ ] Dashboard insights page shows cards for each actionable finding
- [ ] Statistical confidence calculated (minimum 80% to show insight)

---

### Task 3.3: Retainer Engine — Trigger Detection
**Effort:** 1.5 days
**Depends on:** 2.4, 2.9
**Files:**
- `apps/web/src/lib/retainer/trigger-detector.ts` (create)
- `apps/web/src/app/api/cron/retainer-check/route.ts` (create)
- `apps/web/src/db/schema/retainer-suggestions.ts` (create)

**Acceptance Criteria:**
- [ ] Cron job checks daily: proposals marked "hired" + client has repeat-hire >30%
- [ ] Trigger fires only once per client (no duplicate suggestions)
- [ ] Retainer suggestion record created with status "pending"
- [ ] Dismissed clients never re-triggered (permanent dismissal stored)
- [ ] Trigger requires positive outcome (hired status, not just sent)

---

### Task 3.4: Retainer Engine — Pitch Generation + UI
**Effort:** 2 days
**Depends on:** 3.3
**Files:**
- `apps/web/src/app/api/retainer/[id]/generate/route.ts` (create)
- `apps/web/src/app/api/retainer/[id]/dismiss/route.ts` (create)
- `apps/web/src/lib/ai/prompts/retainer-pitch.ts` (create)
- `apps/web/src/app/(dashboard)/retainers/page.tsx` (create)
- `apps/web/src/components/retainer/suggestion-card.tsx` (create)
- `apps/extension/src/popup/RetainerAlert.tsx` (create)

**Acceptance Criteria:**
- [ ] POST `/api/retainer/:id/generate` produces retainer pitch referencing completed work
- [ ] Pitch includes: what was delivered, potential ongoing needs, suggested monthly hours
- [ ] Dashboard retainers page lists pending suggestions with "Generate Pitch" and "Dismiss" buttons
- [ ] POST `/api/retainer/:id/dismiss` marks suggestion as dismissed permanently for that client
- [ ] Extension popup shows notification badge when new retainer suggestion available
- [ ] Generated pitch copyable to clipboard (same pattern as proposals)

---

### Task 3.5: Enhanced Analytics — Time-of-Day + Category Breakdown
**Effort:** 1.5 days
**Depends on:** 2.7
**Files:**
- `apps/web/src/app/api/analytics/summary/route.ts` (modify)
- `apps/web/src/components/analytics/time-heatmap.tsx` (create)
- `apps/web/src/components/analytics/category-breakdown.tsx` (create)

**Acceptance Criteria:**
- [ ] Analytics API returns `best_time_of_day` and `top_category` fields
- [ ] Time heatmap shows proposal success rate by hour of day (when sent)
- [ ] Category breakdown shows win rate per job category
- [ ] Minimum 30 proposals before showing time/category insights
- [ ] Data updates in real-time as outcomes are recorded

---

### Task 3.6: Extension Polish — Keyboard Shortcuts + Animations
**Effort:** 1 day
**Depends on:** 1.10
**Files:**
- `apps/extension/src/content/ui/shortcuts.ts` (create)
- `apps/extension/src/content/ui/animations.css` (create)
- `apps/extension/manifest.json` (modify)

**Acceptance Criteria:**
- [ ] Keyboard shortcut to open proposal panel (Ctrl+Shift+P / Cmd+Shift+P)
- [ ] Keyboard shortcut to copy generated proposal (Ctrl+Shift+C / Cmd+Shift+C)
- [ ] Score badge fade-in animation (not jarring)
- [ ] Proposal panel slide-in/out animation (300ms ease)
- [ ] Shortcuts configurable in extension settings
- [ ] Shortcuts don't conflict with Upwork's own shortcuts

---

### Task 3.7: Monitoring + Alerting Setup
**Effort:** 1.5 days
**Depends on:** 2.12
**Files:**
- `apps/web/src/lib/monitoring/sentry.ts` (create)
- `apps/web/sentry.client.config.ts` (create)
- `apps/web/sentry.server.config.ts` (create)
- `apps/extension/src/lib/sentry.ts` (create)
- `apps/web/src/app/api/cron/ghosted-check/route.ts` (create)

**Acceptance Criteria:**
- [ ] Sentry captures all unhandled errors (API + extension)
- [ ] Alert fires if >5 errors in 5 minutes (email notification)
- [ ] Extension errors reported to Sentry with extension version tag
- [ ] AI provider failures logged with provider name and error type
- [ ] Ghosted-check cron runs daily: marks 14-day-old "sent" proposals as "ghosted"
- [ ] Vercel Analytics tracking page views and Web Vitals on dashboard

---

### Task 3.8: Performance Optimization — Client-Side Heuristic Scoring
**Effort:** 2 days
**Depends on:** 1.7, 1.6
**Files:**
- `apps/extension/src/content/scoring/heuristic.ts` (create)
- `apps/extension/src/content/scoring/ai-threshold.ts` (create)
- `apps/extension/src/content/orchestrator.ts` (modify)

**Acceptance Criteria:**
- [ ] Client-side heuristic scores jobs locally (skills match + budget check) without API call
- [ ] Only jobs passing heuristic threshold (score >40) sent to AI for full scoring
- [ ] Reduces AI scoring API calls by ~60% (measured via usage tracking)
- [ ] Heuristic score shown immediately (<100ms), AI score replaces it when ready
- [ ] User's configured skills and min rate used for heuristic calculation
- [ ] Heuristic-only scores shown with "quick estimate" indicator

---

### Task 3.9: Data Export Formats (CSV + JSON)
**Effort:** 1 day
**Depends on:** 2.13
**Files:**
- `apps/web/src/lib/gdpr/export.ts` (modify)
- `apps/web/src/lib/export/csv-formatter.ts` (create)

**Acceptance Criteria:**
- [ ] Export available in both JSON and CSV formats (user selects)
- [ ] CSV export includes: proposals (with outcomes), analytics summary, portfolio items
- [ ] JSON export includes complete data (all tables for user)
- [ ] Export file size reasonable (<10MB for typical user)
- [ ] Download link sent via email (for large exports) or direct download (for small)

---

### Task 3.10: Production Hardening — Security Headers + Input Validation Audit
**Effort:** 1.5 days
**Depends on:** 2.10
**Files:**
- `apps/web/src/middleware.ts` (modify)
- `apps/web/src/lib/validation/schemas.ts` (create)
- `tests/security/rls-audit.test.ts` (create)
- `tests/security/input-validation.test.ts` (create)

**Acceptance Criteria:**
- [ ] All security headers set: HSTS, X-Content-Type-Options, X-Frame-Options, CSP, X-XSS-Protection
- [ ] All API inputs validated with Zod (no unvalidated user input reaches database)
- [ ] RLS audit test: for each table, verify user A cannot access user B's data
- [ ] JWT validation: expired tokens rejected, malformed tokens rejected, wrong signature rejected
- [ ] Rate limiting tested: verify 429 returned when limits exceeded
- [ ] No secrets in extension bundle (verified by build-time check)

---

### Task 3.11: Landing Page + Marketing Site
**Effort:** 2 days
**Depends on:** 2.5
**Files:**
- `apps/web/src/app/(marketing)/page.tsx` (create)
- `apps/web/src/app/(marketing)/layout.tsx` (create)
- `apps/web/src/components/marketing/hero.tsx` (create)
- `apps/web/src/components/marketing/features.tsx` (create)
- `apps/web/src/components/marketing/testimonials.tsx` (create)
- `apps/web/src/components/marketing/cta.tsx` (create)
- `apps/web/src/app/(marketing)/privacy/page.tsx` (create)
- `apps/web/src/app/(marketing)/terms/page.tsx` (create)

**Acceptance Criteria:**
- [ ] Landing page at root URL (unauthenticated users) with: hero, feature highlights, pricing, CTA
- [ ] Privacy policy page (required for Chrome Web Store)
- [ ] Terms of service page
- [ ] Mobile responsive (tested at 375px, 768px, 1440px)
- [ ] LCP <2s, CLS <0.1
- [ ] "Install Extension" CTA links to Chrome Web Store listing
- [ ] SEO meta tags + Open Graph tags for social sharing

---

## Cost Summary

| Phase | Dev Days | Calendar Weeks (solo) | Infra Cost/Month |
|-------|----------|----------------------|------------------|
| Phase 1: MVP | 28 days | 6 weeks | $150 |
| Phase 2: V1.0 | 24 days | 5 weeks | $669 |
| Phase 3: V1.5 | 18 days | 4 weeks | $1,688 |
| **Total** | **70 days** | **15 weeks** | — |

### Development Hours by Phase

| Phase | Days | Hours (8hr/day) | Contingency (20%) | Total Hours |
|-------|------|-----------------|-------------------|-------------|
| Phase 1 | 28 | 224 | 45 | **269** |
| Phase 2 | 24 | 192 | 38 | **230** |
| Phase 3 | 18 | 144 | 29 | **173** |
| **Total** | **70** | **560** | **112** | **672** |

### Infrastructure Cost Projection

| Month | Phase | Users (est.) | Monthly Cost |
|-------|-------|-------------|--------------|
| Month 1-2 | Building MVP | 0 | $20 (dev only) |
| Month 2-3 | MVP Beta | 20-50 | $150 |
| Month 3-4 | V1.0 Launch | 50-200 | $669 |
| Month 5-6 | V1.5 Growth | 200-500 | $1,688 |
| Month 7+ | Scale | 500-1000 | $3,248 |

### Break-Even Target

- **12-24 paying users** at mixed pricing (~$45 avg) covers infrastructure
- **Target:** 50 paying users by end of Month 4 = $2,250 MRR vs $669 costs = profitable

---

## Dependency Graph (Critical Path)

```
1.1 (scaffold) ──┬── 1.2 (DB) ──── 1.3 (auth) ──┬── 1.4 (ext auth)
                  │                                │── 1.5 (settings)
                  │                                │── 1.11 (portfolio)
                  │                                └── 2.5 (dashboard)
                  │
                  └── 1.6 (DOM parser) ──┬── 1.7 (scoring API) ──── 1.8 (badge UI)
                                         │                     └── 1.9 (generation API) ── 1.10 (panel UI)
                                         └── 1.12 (degradation)

Critical path: 1.1 → 1.2 → 1.3 → 1.7 → 1.9 → 1.10 → 1.16 (E2E)
```

---

*End of Task Breakdown*
