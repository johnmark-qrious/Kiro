---
inclusion: always
---

# Skill Matrix

Maps projects to required skills per agent. When an agent is deployed for a task, check this matrix against the active project. Load any listed skills BEFORE starting work.

## How It Works

1. Agent workflow identifies the active project (from repo path or `.config.kiro`)
2. Before deploying any agent, check this matrix
3. Load all skills listed for that agent + project combination
4. Skills are additive (project skills + any universal skills the agent already loads)

## Matrix

| Project | Agent | Required Skills | Notes |
|---------|-------|----------------|-------|
| agent-forge | @frontend | `r3f-drei-patterns`, `framer-motion-page-transitions`, `frontend-design` | 3D + animation + distinctive visuals |
| agent-forge | @designer | `r3f-drei-patterns`, `frontend-design`, `branding-reference` | Needs to understand R3F constraints + design philosophy + living brand guide |
| ubiquity | @frontend | `design-to-shadcn` | When translating a design/prototype to components |
| ubiquity | @backend | — | Covered by guides |
| zespri | @frontend | — | Legacy patterns in knowledge base |

## Universal Skills (all projects, all agents)

These load based on situation, not project:

| Skill | Trigger | Loaded By |
|-------|---------|-----------|
| `systematic-debugging` | Bug/failure encountered | @frontend, @backend (in agent prompt) |
| `requirements-logic-audit` | Design phase, reviewing specs/ACs before task breakdown | @architect |
| `skill-creator` | @skill-auditor flags gap with "Draft skill" | Orchestrator |
| `to-prd` | Evaluating/contributing to an external open source project not authored by us | @architect (reverse-engineers the project into a PRD for understanding) |

## Adding a New Project

When starting work on a new project:

1. Add a row per agent that needs project-specific skills
2. If skills don't exist yet, flag as gap (triggers skill-creator)
3. Use `—` for agents that are fully covered by existing guides

## Resolving Active Project

Priority order:
1. `.config.kiro` in current worktree (has `project` field)
2. Repo path matching (e.g., path contains `agent-forge` → project is agent-forge)
3. User states it explicitly ("working on Zespri")
4. Ask if ambiguous

## Don't Do This

- Don't load ALL skills for a project upfront — only the ones for the active agent
- Don't add skills here that are already in the agent's guide references (that's duplication)
- Don't add universal skills to project rows (keep them in the universal table)
- Don't skip this check because "it's a small task" — skills exist because agents failed without them
