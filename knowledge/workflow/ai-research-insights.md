---
sync: draft
lastLocalEdit: 2026-05-14T00:14:00+12:00
---

# AI-Assisted Development - Research Insights & Gaps

> Sources: MIT CSAIL "Challenges and Paths Towards AI for Software Engineering" (July 2025), Devin "Agents 101" (June 2025), arxiv papers on autonomous coding agents.

## The 5 Unsolved Problems (MIT CSAIL, 2025)

1. **Code generation is the easy part.** Refactoring, migration, testing, maintenance, code review, performance optimization - all unsolved at scale.
2. **No confidence/uncertainty signal.** AI can't say "this part I'm sure about, this part - double check." No channel to defer to human when unsure.
3. **Scale breaks everything.** Every company's codebase is out-of-distribution. AI calls non-existent functions, violates style rules, fails CI.
4. **Retrieval is broken.** Finds code with similar NAMES (syntax) not similar FUNCTIONALITY (semantics). Easily fooled.
5. **Benchmarks don't measure real work.** SWE-Bench = 200 lines, single issue. Real engineering = millions of lines, multi-system, human-AI collaboration.

## What Devin's Team Learned (Practitioners)

- Say HOW not just WHAT (provide architecture upfront)
- 80% time savings, not 100% automation
- Start fresh when stuck (agents recover poorly from bad state)
- Increase test coverage in AI hot spots BEFORE letting AI modify
- Senior-to-staff engineers adopt fastest (they know what to delegate)
- Known limitations: poor debugging, poor visual reasoning, knowledge cutoffs

## Where Current Setup Is Already Ahead

| "Unsolved" Problem | Already Solved By |
|-------------------|-------------------|
| AI doesn't know company conventions | Steering files + guides + knowledge base |
| No confidence signal | Tournament pattern (Dark Architect challenges weak output) |
| Can't handle large codebases | Parallel subagents with scoped tasks |
| No process knowledge | adaptive-workflow.md, git protocols, planning guides |
| Retrieval finds wrong code | Semantic knowledge base + manual curation |
| No self-improvement | guide-evolution.md (agents update own guides) |

## The Gaps (Opportunities to Get Ahead)

| Gap | Research Says | Could Build |
|-----|-------------|-------------|
| Automated eval | "No channel for AI to expose confidence" | Post-agent scoring: follows guides? Compiles? Matches patterns? |
| Recovery from bad state | "Starting fresh beats iterating on broken" | Auto-detect stuck agent (3+ retries same error) → kill + restart smarter |
| Semantic code search | "Retrieval fooled by similar names" | AST-aware indexing (not just text grep) |
| Multi-agent memory | Parallel agents don't share discoveries | Shared scratchpad between subagents |
| Benchmark own agents | Nobody measures "did the agent help?" | Track: first-try vs rework, time saved vs review time, guide updates triggered |

## Bleeding Edge Trajectory (2025-2028)

### Model Layer (Anthropic/OpenAI/DeepMind)
- Agents that use computers (navigate UIs, click, fill forms)
- Models that reason for hours (sustained problem solving with working memory)
- Self-improving systems (evaluate own output, request better training)

### Framework Layer (Vercel/Next.js)
- AI as first-class primitive (not "add AI" but "app IS AI interaction")
- Death of CRUD (AI generates UI from data + intent)
- Edge compute + AI (sub-100ms inference at CDN edge)

### Infrastructure Layer (Temporal, Modal, Replicate)
- GPU as commodity (serverless, per-token billing)
- Durable execution for AI (workflows surviving days/weeks)
- Multi-agent infrastructure (message passing, shared memory, consensus)

### Developer Tools Layer (Cursor, Kiro, Copilot)
- Context is everything (steering files, knowledge, project context)
- Spec-driven development (specs as source of truth, code as derivative)
- Continuous AI review (monitors codebase for drift, staleness, inconsistency)

## The Meta-Insight

The toolmakers aren't thinking "better chatbot." They're thinking:

> "How do I make software that improves itself over time without human intervention?"

The question isn't "what should I build?" It's: "Which parts of my workflow are still manual that could be self-improving?"

## Next Actions (Personal Upskill)

1. **Production RAG** - Build it properly with evaluation metrics (Zespri opportunity)
2. **Agent evaluation** - How do you know agents give good answers? Evals are the missing piece.
3. **Edge inference** - For enterprise clients who can't send data to external APIs
4. **Measure your own agents** - Track first-try success rate, rework rate, time saved
5. **Automate recovery** - When agent is stuck, restart smarter automatically
6. **Shared state between parallel agents** - One agent's discovery benefits others
