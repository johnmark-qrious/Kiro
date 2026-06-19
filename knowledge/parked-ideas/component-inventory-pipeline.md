---
sync: draft
lastLocalEdit: 2026-05-19T22:00:00+12:00
---

# Parked Idea: Behaviour-Based Component Inventory Pipeline

## Status: Parked (2026-05-19)
Deathmatch PASSED with conditions. Not yet implemented.

## The Idea
Insert a behaviour-based component classification step between design approval and @taskmaster in the UI feature pipeline.

When UI/UX delivers a React prototype (Vercel), orchestrator reads source and classifies each component by BEHAVIOUR:
- USE EXISTING: behaviour matches, looks the same → no subtask
- VARIANT STYLE: behaviour matches, looks different → minor subtask (CSS/props only)
- NEW COMPONENT: no existing component does this → dedicated subtask with full design-to-shadcn

## Decision Tree
1. Read prototype component source
2. Identify what it DOES (selects option, displays tabular data, toggles state)
3. Match behaviour against existing components in packages/ui and shadcn
4. Classify: USE / VARIANT / NEW

## Key Rules
- Classification is behaviour-based, not visual (AI can compare code reliably, not pixels)
- "Variant" threshold: achievable with different className/variant prop? → variant. Needs different DOM/events? → new
- NEW components get own subtask with full RECON → MAP → BUILD → VERIFY
- Feature tasks blocked until component subtasks complete
- Mid-flight discovery: @frontend can STOP and report if something should be separate

## Pipeline Position
```
@architect → @dark-architect → user approval → [COMPONENT INVENTORY] → @taskmaster → implementation
```

## Deathmatch Conditions (must address before implementing)
1. Define registry schema: `component-classifications.json` (file path, content hash, classification, confidence score, prompt version, timestamp)
2. Lock prompt version contract: changing classification prompt = full re-seed
3. Define SKIP threshold: confidence score below X = flag for human
4. Verify seed parameter works with our model (fallback: cache layer alone)

## Optional Improvements
- Dry-run mode for local testing
- Classification diff in PR comments
- Confidence histogram after batch seed

## Origin
Vectorstorm → picked Option 2 (Taskmaster Inventory) refined with behaviour-based matching → Deathmatch validated
