---
inclusion: manual
---

# Scripts

Shortcut keywords that trigger specific actions. When the user says one of these words, execute the corresponding action immediately — no confirmation needed.

## Staleness Checks

At the start of each session, silently check:
- Read `/mnt/c/Users/T828819/.kiro/knowledge/last-upskill.md` — if the date is older than 3 months (or the file doesn't exist), suggest: "It's been over 3 months since your last upskill. Want me to run it?"
- Do NOT block the session or auto-run. Just mention it once.
- Scan `.kiro/knowledge/*.md` and `.kiro/knowledge/sessions/*.md` frontmatter for `sync:` values. Count files with `draft` and `modified` status. If any are `modified`, report: "Knowledge sync: {M} modified. Run `sync check` to publish." If all are `published` or `draft`, say nothing.

| Keyword | Action |
|---------|--------|
| `synthesis` | `/spawn` with prompt: "Read `/mnt/c/Users/T828819/.kiro/guides/workflow/learning-synthesis.md` and execute the synthesis prompt inside it." After completion, update `/mnt/c/Users/T828819/.kiro/knowledge/last-synthesis.md` with today's date. |
| `guide cleanup` | `/spawn` with prompt: "Scan all guides in `/mnt/c/Users/T828819/.kiro/guides/`. Find duplicate content across guides, stale entries, conflicting recommendations, and overly verbose sections. Propose consolidations and removals." |
| `pr status` | Check all open PRs across Ubiquity repos (WebApps, Backend, Protos, Connectors) and summarize: branch, title, review status, CI status. |
| `dep check` | For the current worktree: read `.config.kiro`, check if dependency PRs are merged via GitHub, report which are ready and which are blocking. |
| `post-merge retro` | After user reports a PR merge: verify via GitHub MCP, diff planned tasks (tasks.md) vs what shipped, note scope changes or workarounds, write a 3-line retro to the Notion Feature_Page, flag if any guide would have prevented issues found during review. For worktree features, merge status is already discovered automatically during dependency check reconciliation — this script adds the retrospective content on top. **Health check tracking**: after each retro, update `/mnt/c/Users/T828819/.kiro/knowledge/last-health-check.md` — increment "PRs since last check" by 1 and append the repo name to the repos list. If PRs since last check reaches 10+, nudge: "10+ PRs since last health check. Want to run it?" If 3+ unique repos appear in the list, nudge: "Recent merges touched 3+ repos. Good time for a health check." |
| `parallel qa` | (CLI only) While implementing the current task, `/spawn` a QA review of the previously completed task. Usage: "parallel qa [task number or file path just completed]". Spawns `@quality-assurance` to review while you keep working. |
| `drift check` | `/spawn` with prompt: "Read `/mnt/c/Users/T828819/.kiro/steering/ubiquity-architecture.md`. Then scan actual repo structures, package.json files, and proto definitions across Ubiquity repos. Flag any mismatches where the architecture doc says X but the codebase shows Y. Output a list of proposed corrections to the architecture doc." |
| `smart split` | Before splitting tasks, query Notion Engineering Decisions database for past features in the same domain. Summarize which task splits worked well (small PRs, clean merges) vs poorly (merge conflicts, scope creep). Feed this context to @taskmaster before it produces the task breakdown. |
| `deps` | Given a repo or component name, show all downstream consumers and upstream dependencies. Lists which repos import/reference it, what breaks if it changes, and what regeneration steps are needed. Auto-triggered during planning/design — can also be called manually. For proto changes specifically, read `.kiro/guides/agent-workflow/proto-cascade-detector.md` and execute the full cascade detection procedure. |
| `cleanup` | After a feature merges to main: read `.config.kiro` for branch and repo, remove all worktrees under `../{repo}-worktrees/{feature-name}/`, delete the feature folder, delete all sub-branches and the base branch locally and on origin, update Notion Feature_Page status to "Completed". |
| `upskill` | Check for new patterns, releases, and breaking changes in the project's stack. For each technology (Next.js, React, Tailwind, Bun, Biome, .NET, NUnit, gRPC, Buf, Connect, Prefect, FastAPI, Terraform), search official docs and changelogs for updates since the last upskill. Compare against current guides and propose updates. Also check skills.sh for vendor-provided skills (Vercel, Anthropic, GitHub only — skip community skills). Record the date in `/mnt/c/Users/T828819/.kiro/knowledge/last-upskill.md`. |
| `trace` | Given a file path, use LSP (get_document_symbols, find_references, goto_definition) to map: 1) What's inside the file (classes, methods, properties), 2) Who calls it (upstream consumers), 3) What it depends on (downstream dependencies). Output a Mermaid diagram of the relationships + a text summary. Usage: `trace path/to/file.cs` or `trace path/to/Component.tsx`. |
| `visualize` | Generate a full system Mermaid diagram from `/mnt/c/Users/T828819/.kiro/steering/ubiquity-architecture.md`. Output: 1) C4 context diagram (repos + external systems), 2) Data flow diagram (how data moves between services), 3) Dependency graph (what depends on what, including packages). Ready to paste into Notion, Miro, or any Mermaid renderer. |
| `review` | Switch to `@pr-reviewer` agent. Give it a PR URL or PR number + repo. It reads the PR description, linked issues, and code changes, then presents findings for your approval before posting any comments. |
| `rescan` | Given a knowledge entry name (e.g., `rescan backend-mvc-architecture`), re-read the source files and directories referenced in that `.kiro/knowledge/` entry, check `git log --since="30 days" --name-only` for recent changes in those areas, spawn @architect to compare current state against the knowledge file, and propose updates for anything that's changed, new, or stale. If no name given, list all knowledge entries from `.kiro/knowledge/README.md` and ask which to rescan. After updates are approved, re-index the entry via `knowledge update`. |
| `local sync` | In the `-local` worktree: 1) `git reset --hard {branch}` to start clean, 2) Read `worktree-plan.md` for merge order, 3) Merge each sub-PR branch in dependency order (foundation first, then parallel, then integration) — skip any PR with no commits yet, 4) Report merge results: which PRs merged cleanly, which had conflicts, which were skipped, 5) If all merged cleanly, run `@quality-assurance` on the full diff vs main — map each issue to the owning PR via `file-claims.md`, 6) Output: which PR needs to fix what. Respects dependency order — won't merge PR2 if PR1 hasn't been merged first. |
| `sync check` | Scan all `.kiro/knowledge/*.md` and `.kiro/knowledge/sessions/*.md` for sync frontmatter. For each file with `sync: draft` (first publish) or `sync: modified` (update): if `notionPageId` is empty, create a new Notion page in the Engineering Decisions database and save the ID back to frontmatter. If `notionPageId` exists, update that Notion page with the file content. After successful write, set `sync: published` and `lastPublished` to now. Report: how many files synced, how many already published, how many still draft. |
| `health check` | Strategic codebase health analysis. Spawns `@architect` with three lenses: **1) Hotspots** — query `git log --since` across Ubiquity repos to find files appearing in >50% of recent PRs (coupling magnets). **2) Guide drift** — compare code patterns against guides in `/mnt/c/Users/T828819/.kiro/guides/` to find cases where the letter of the guide is followed but the spirit is violated (e.g., fp-ts pipes with 15+ args, over-abstracted components, validation patterns diverging from conventions). **3) Refactor candidates** — for anything surfaced in 1 or 2, produce a refactor proposal with scope, risk, and estimated effort. Alert only — no auto-refactoring. Record the date in `/mnt/c/Users/T828819/.kiro/knowledge/last-health-check.md`. |
| `scripts` | List all available scripts from this table. |
| `knowledge sync local` | Run `~/.kiro/scripts/sync-knowledge-to-global.ps1 -WorkspacePath "<current-workspace-path>"` to copy all workspace `.kiro/knowledge/*.md` files to global `~/.kiro/knowledge/`. Skips README.md. Reports created/updated/unchanged counts. |
| `grill me` | Tournament-style adversarial review. **Round 1:** @dark-architect grills the idea, produces N numbered challenges rated FATAL/SERIOUS/MINOR. **Round 2:** For each STRONG challenge (SERIOUS+), spawn a defender agent (usually @architect) to counter-argue. Prune MINOR challenges immediately. **If multiple defense angles exist for a challenge, spawn ALL of them in parallel (2-5 defenders per challenge). Only spawn 1 defender if there's genuinely only one viable counter-argument — and state why.** **Round 3:** @dark-architect reviews defenses, kills weak ones, escalates surviving concerns. **Stop when:** all challenges are either killed (idea is solid) or undefeated (real risk found). Output: final verdict with surviving risks and recommended changes. Best for: architecture decisions, new infrastructure proposals, migration strategies, greenfield design validation. **NEVER skip Round 3.** The orchestrator does not declare winners — only the Dark Architect can kill or accept a defense. **Fact-check rule:** If the Dark Architect rejects a defense based on a technical claim about how a tool/library/framework works (not a design opinion), the orchestrator must verify the claim before accepting the rejection. Unverified technical claims cannot kill a defense. |


## Gladiator Roster (Tournament Defenders)

Non-permanent roles spawned during `grill me` tournaments. The orchestrator picks which gladiators are relevant per challenge — not every gladiator fights every round.

| Gladiator | Fighting Style | Deploy When |
|-----------|---------------|-------------|
| @architect | "Here's how to make it work" | Always (default defender) |
| @cost-analyst | "What does this cost in money, time, and opportunity?" | Infrastructure, build vs buy, new dependencies |
| @user-advocate | "What does the user actually experience?" | Any decision with UX consequences (even backend) |
| @ops-gladiator | "Who deploys this at 2am when it breaks?" | New services, infra changes, monitoring gaps |
| @legacy-defender | "The current thing works. Prove the new thing is worth the tax." | Any rewrite/migration proposal |
| @future-self | "It's 2 years from now. Does this still make sense?" | Tech choices, dependency adoption, patterns |
| @simplicity | "Can you explain this to a new dev in 5 minutes?" | Over-engineering detection |

**Rule:** Don't force a gladiator into the arena if they have nothing meaningful to argue. If a challenge is purely technical with no user/ops/cost angle, only @architect defends.

## Scoreboard

Track tournament results across sessions. Update after each `grill me` completes.

| Date | Idea | Verdict | Winning Gladiator | Dark Architect Score |
|------|------|---------|-------------------|---------------------|
| 2026-05-13 | Durable Functions for CSV | KILLED | @simplicity (batch prefetch is simpler) | DA: 1, Defenders: 0 |
| 2026-05-13 | SCSS → Tailwind | KILLED | @legacy-defender (qubic-lib forces dual system) | DA: 2, Defenders: 0 |
| 2026-05-13 | TestContainers | SURVIVED | @architect (dacpac solves schema problem) | DA: 2, Defenders: 1 |
| 2026-05-13 | DataTable approach | Option A won | @simplicity (no virtualization needed) | DA: 2, Defenders: 2 |
| 2026-05-13 | React Query vs custom hook | SURVIVED | @architect + @user-advocate (harvest season proves value) | DA: 2, Defenders: 3 |
| 2026-05-13 | Pagination everywhere | KILLED | @legacy-defender + @user-advocate (search-first + circuit breaker) | DA: 3, Defenders: 3 |
| 2026-05-13 | Prisma raw SQL strategy | Status quo SURVIVED | @architect (FOR JSON is correct, harden don't rewrite) | DA: 3, Defenders: 4 |

**Season Record: Dark Architect 3 — Defenders 4**
