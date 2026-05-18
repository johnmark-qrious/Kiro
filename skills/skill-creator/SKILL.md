---
name: skill-creator
description: Create new skills, improve existing skills, and measure skill performance with structured evals. Use when users want to create a skill from scratch, edit or optimize an existing skill, run evals to test a skill, benchmark skill performance, or when @skill-auditor flags a gap with action "Draft skill" or "Research + draft".
inclusion: manual
lastVerified: 2026-05-16
---

# Skill Creator

Create, test, and iteratively improve skills using structured evaluations.

## When This Triggers

- @skill-auditor flags a gap with action "Draft skill" or "Research + draft"
- User says "create a skill for X" or "make a skill"
- User wants to improve an existing skill's reliability
- User wants to benchmark whether a skill actually helps

## Process Overview

1. Capture intent
2. Research (if needed)
3. Draft the skill
4. Create test cases
5. Run evaluations (with/without skill)
6. Grade results
7. Iterate based on feedback
8. Optimize description for trigger accuracy
9. Final verification
10. Store in /skills/

## Step 1: Capture Intent

Ask four questions:

1. **What should this skill enable?** Specific outcome, not vague capability.
2. **When should it trigger?** What user phrases, contexts, or @skill-auditor gaps?
3. **What's the expected output?** Files, code patterns, structured data?
4. **Are outputs objectively verifiable?** If yes, create quantitative evals. If subjective, qualitative review only.

If triggered by @skill-auditor, the gap table already answers #1 and #2. Extract from there.

## Step 2: Research (If Action Was "Research + draft")

Before writing the skill:

1. Search official docs for the technology (web_search + web_fetch)
2. Find 3-5 authoritative examples of correct usage
3. Identify common pitfalls and anti-patterns
4. Note version-specific behavior (pin to current version)
5. Verify claims - don't hallucinate APIs or patterns

Output: research notes (kept in workspace, not committed).

Skip this step if the technology is well-known and the action was plain "Draft skill".

## Step 3: Draft the Skill

Write to `/skills/{skill-name}/SKILL.md` (or `/skills/{skill-name}.md` for simple skills).

### Format

```markdown
---
name: {skill-name}
description: {What it does. When to use it. Trigger phrases. Be slightly pushy.}
inclusion: manual
lastVerified: {today}
---

# {Skill Name}

## When to Use
{Specific contexts and trigger conditions}

## Core Instructions
{The actual skill content - patterns, rules, examples}

## Examples
{Input/output pairs showing correct usage}

## Don't Do This
{Anti-patterns and common mistakes}
```

### Writing Rules

- Under 500 lines for the main file. Use bundled references for depth.
- Explain WHY, not just WHAT. LLMs respond to reasoning better than rules.
- Use imperative form: "Always check X" not "You should check X"
- Include input/output examples for every non-obvious instruction.
- Don't write ALWAYS/NEVER in caps - reframe as reasoning instead.

## Step 4: Create Test Cases

Create 2-5 realistic test prompts. Save to workspace:

```
.kiro/skills/{skill-name}/evals/
├── evals.json
└── workspace/
    └── iteration-{N}/
        ├── eval-{id}-with-skill/
        └── eval-{id}-baseline/
```

### evals.json Format

```json
{
  "skill_name": "design-to-shadcn",
  "evals": [
    {
      "id": 1,
      "prompt": "Realistic user request that should trigger this skill",
      "expected_output": "Description of what good output looks like",
      "assertions": [
        {
          "name": "uses_shadcn_components",
          "description": "Output uses shadcn/Radix, not raw HTML",
          "type": "contains|regex|custom",
          "value": "pattern to check"
        }
      ],
      "files": ["optional context files needed"]
    }
  ]
}
```

### Good Test Prompts

- Written like a real user would (casual, specific, with context)
- Include edge cases the skill should handle
- Mix simple and complex scenarios
- Include at least one near-miss (should NOT trigger but is close)

Share test cases with user before running: "Here are the test scenarios. Look right, or want to adjust?"

## Step 5: Run Evaluations

For each test case, spawn two parallel subagents:

**With-skill run:**
```
Role: The agent that would use this skill (e.g., @frontend)
Prompt: Include the skill content + the test prompt
Output to: workspace/iteration-{N}/eval-{id}-with-skill/
```

**Baseline run:**
```
Role: Same agent, no skill loaded
Prompt: Just the test prompt, no skill content
Output to: workspace/iteration-{N}/eval-{id}-baseline/
```

Use the `subagent` tool with parallel stages (no dependencies between eval runs).

## Step 6: Grade Results

### Quantitative (if assertions exist)

For each assertion, check the output:
- `contains`: output includes the value string
- `regex`: output matches the regex pattern
- `custom`: describe what to check (graded by QA agent)

### Qualitative

Present both outputs (with-skill vs baseline) to the user side by side. Ask:
- Which is better?
- What's missing from the with-skill version?
- Any issues introduced by the skill?

### Benchmark Summary

```markdown
## Benchmark: {skill-name} (Iteration {N})

| Eval | With Skill | Baseline | Delta |
|------|-----------|----------|-------|
| eval-1 | 4/5 assertions | 2/5 assertions | +2 |
| eval-2 | 3/3 assertions | 1/3 assertions | +2 |

Pass rate: 87% (with) vs 43% (baseline)
```

## Step 7: Iterate

Read user feedback. Apply improvements:

- **Generalize** - don't overfit to specific test cases
- **Keep it lean** - remove instructions that don't improve results
- **Explain the why** - if a rule keeps being ignored, add reasoning
- **Bundle repeated work** - if every run writes the same helper, include it in the skill

Increment iteration number. Re-run all evals. Compare to previous iteration.

Continue until:
- User says they're happy
- Pass rate plateaus (no improvement across 2 iterations)
- All assertions pass consistently

## Step 8: Optimize Description

The `description` field in frontmatter controls when the skill triggers.

### Generate Trigger Eval Set

Create 10-15 queries:
- 5-8 should-trigger (different phrasings of the same intent)
- 5-7 should-NOT-trigger (near-misses, adjacent domains)

### Test Current Description

For each query, ask: "Given this user request and this skill description, would you load this skill?"

Score: correct triggers / total queries.

### Iterate Description

If score < 80%, rewrite the description:
- Add specific trigger phrases
- Add "Use when..." clauses
- Add "NOT for..." exclusions if false positives occur

Re-test. Pick the description with highest score on held-out queries.

## Step 9: Final Verification

Run the full eval set one more time with the final skill. Confirm:
- [ ] All critical assertions pass
- [ ] No regressions from previous iteration
- [ ] Description triggers correctly (>80% accuracy)
- [ ] Skill is under 500 lines
- [ ] Examples are accurate and tested
- [ ] "Don't Do This" section covers known pitfalls

## Step 10: Store and Register

1. Move from workspace to permanent location: `/skills/{skill-name}/SKILL.md`
2. If bundled resources exist, include them:
   ```
   /skills/{skill-name}/
   ├── SKILL.md
   └── references/
       └── {topic}.md
   ```
3. Clean up workspace (delete `evals/workspace/iteration-*/`)
4. Keep `evals/evals.json` for future regression testing
5. Update the skill-audit gap table to show this gap as ✅ Covered

## Skill Categories

### Capability Uplift (has a retirement date)
Fills a gap in model capabilities. Examples: PDF handling, design-to-code translation.
As models improve, these may become unnecessary. Mark with `retirement-check: {date}` in frontmatter.

### Workflow/Convention (long-lived)
Encodes team conventions, project patterns, compliance rules.
These don't retire - they evolve with the codebase. No retirement date needed.

## Integration with @skill-auditor

When @skill-auditor produces a gap table with "Draft skill" action:

1. This skill activates automatically
2. Technology name and design context are passed as input
3. Skip Step 1 (intent already captured in gap table)
4. Start at Step 2 (Research) or Step 3 (Draft) depending on action type

After skill is created:
- @skill-auditor re-runs on the same design
- The gap should now show ✅ Covered
- If it doesn't, the description needs optimization (Step 8)

## Don't Do This

- Don't create skills for one-off technologies you'll never use again
- Don't skip evals for skills that will be reused across projects
- Don't write skills from memory - always verify against official docs
- Don't make skills too restrictive (MUST/NEVER/ALWAYS in caps)
- Don't bundle the entire documentation - progressive disclosure, load on demand
- Don't create a skill when a guide update would suffice (skills = new capability, guides = conventions for existing agents)
