---
inclusion: fileMatch
fileMatchPattern: ".kiro/agents/*.md"
---

# Token Efficiency Rule (Sub-Agent Delegation)

When delegating work to ANY sub-agent (@frontend, @architect, @tester, @quality-assurance, @protobuf-engineer, @github-agent):

1. **If you already have file contents in context** from the current conversation → pass them in the sub-agent prompt
2. **If you don't have file contents in context** → delegate immediately and let the sub-agent explore on its own
3. **NEVER read files solely to forward them to a sub-agent** — this wastes tokens and duplicates work

The sub-agents have their own read tools. They can explore the codebase themselves. Your job is to delegate with a clear task description, not to pre-load context for them.

## Prompt Structure (Lost-in-the-Middle Rule)

LLMs attend best to the START and END of their context window. Material buried in the middle gets degraded attention (Liu et al. 2023, confirmed on long-context models through 2026).

**Every subagent prompt MUST follow this sandwich structure:**

```
[TOP — highest attention]
1. Task: what to do (one sentence)
2. Hard constraints / non-negotiables
3. Output format expected

[MIDDLE — lowest attention]
4. Supporting context (file contents, background)
5. Related information, examples
6. Less critical details

[BOTTOM — high attention]
7. Success criteria: what "done" looks like
8. Repeated constraints (restate anything from section 2 that's critical)
```

**Rules:**
- Never bury a critical constraint in the middle of a large context block
- If the prompt exceeds ~1500 tokens, explicitly repeat non-negotiable constraints at the end
- For short prompts (<500 tokens), structure doesn't matter — the whole thing fits in the attention sweet spot

## Caveman Mode (Sub-Agent Responses)

All sub-agent responses back to the orchestrator use **caveman-full** by default. Include this instruction in every sub-agent prompt:

> Respond terse. Drop articles, filler, hedging. Fragments OK. Technical terms exact. Code blocks unchanged. Errors quoted exact. Pattern: `[thing] [action] [reason]. [next step].`

**Exceptions (drop caveman, use full prose):**
- Security warnings or irreversible action confirmations
- Multi-step sequences where fragment order risks misread
- When reporting to the user directly (user-facing output stays normal)

**Intensity by agent:**
| Agent | Level | Why |
|-------|-------|-----|
| @frontend, @backend | full | Implementation reports don't need prose |
| @quality-assurance | lite | Findings need clarity, but no filler |
| @tester | full | Test results are structured data |
| @architect | lite | Design reasoning needs some connective tissue |
| @dark-architect | lite | Arguments need to be followable |
| @github-agent | full | Status reports only |

## Static Model Assignment

Pin models per agent role in subagent calls. Not every task needs Opus.

| Agent | Model | Rationale |
|-------|-------|-----------|
| @architect | claude-sonnet-4-20250514 | Design reasoning doesn't need max intelligence, benefits from speed |
| @dark-architect | claude-sonnet-4-20250514 | Adversarial review is pattern-matching, not generation |
| @frontend | claude-opus-4-20250514 | Implementation needs highest accuracy for complex code |
| @backend | claude-opus-4-20250514 | Same — implementation accuracy matters |
| @quality-assurance | claude-sonnet-4-20250514 | Review is analysis, not generation |
| @tester | claude-sonnet-4-20250514 | Test writing follows patterns, doesn't need Opus |
| @github-agent | claude-sonnet-4-20250514 | PR creation is templated work |
| @protobuf-engineer | claude-opus-4-20250514 | Proto changes are high-stakes, need precision |
| @skill-auditor | claude-sonnet-4-20250514 | Gap detection is search + comparison |
| @taskmaster | claude-sonnet-4-20250514 | Decomposition from existing design, not novel reasoning |

**Override:** If an agent task is unusually complex or high-risk, the orchestrator may escalate to Opus. State why in the subagent prompt.

**When to use Opus regardless:** Cross-repo changes, unfamiliar domain, security-sensitive code, or when a Sonnet attempt already failed.

## Context-Mode Principle (Think in Code)

When a sub-agent needs to analyze many files (10+), instruct it to:

> Instead of reading all files into context, write a script that performs the analysis and report only the result. Example: instead of reading 50 component files to find which use a specific import, run `grep -r "import.*Thing" src/ --files-with-matches` and report the file list.

This applies to:
- Codebase-wide searches (use grep/glob, not sequential file reads)
- Pattern detection across files (write a script, report findings)
- Dependency analysis (use package.json/tsconfig reads, not source traversal)
- Large file analysis (extract the relevant section, not the whole file)

**Rule:** If the answer can be obtained by running a command and reading its output, prefer that over reading raw files into context.

## Token Budget Awareness

Track context usage per subagent to catch runaway sessions before they produce degraded output.

**Signs of budget exhaustion (act on any):**
- Subagent response becomes repetitive or circular
- Agent re-reads files it already read in the same session
- Output quality drops noticeably vs earlier in the session
- Agent starts hallucinating file contents instead of reading them

**Preventive measures:**
- For implementation tasks: cap at ~60% of context window for code + file reads. Reserve 40% for reasoning, tool calls, and output.
- For QA/review tasks: cap file reads at 15 files. If more files are relevant, split into multiple passes.
- For AFK batches: if a single task exceeds 3 subagent attempts, halt and escalate to the user. The task is likely underspecified.

**When reporting to user:** After AFK batches or long feature sessions, note which stages were lightweight vs heavy. Pattern: "Tasks 1-3 completed in single pass. Task 4 required 2 attempts (first pass missed error boundary — AC was ambiguous)." This feeds into cost reporting per `session-continuity.md`.

**Rule:** If an agent is spending more tokens *finding* the right files than *implementing* the change, the context engineering is wrong. Fix the retrieval (better grep, narrower scope, explicit file paths in the prompt) rather than giving the agent more runway.