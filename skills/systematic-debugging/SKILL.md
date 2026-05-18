---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior. Enforces root cause investigation before proposing fixes. Use ESPECIALLY when under time pressure, when "just one quick fix" seems obvious, or when previous fixes haven't worked.
inclusion: manual
lastVerified: 2026-05-16
---

# Systematic Debugging

## Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.
```

If you haven't completed Phase 1, you cannot propose fixes. Symptom fixes are failure.

## When to Use

Any technical issue: test failures, bugs, unexpected behavior, build failures, integration issues.

Use ESPECIALLY when:
- Under time pressure (rushing guarantees rework)
- "Just one quick fix" seems obvious
- You've already tried one fix and it didn't work
- You don't fully understand the issue

## Phase 1: Root Cause Investigation

BEFORE attempting ANY fix:

1. **Read error messages completely** - stack traces, line numbers, error codes. Don't skip.
2. **Reproduce consistently** - exact steps, every time? If not reproducible, gather more data.
3. **Check recent changes** - git diff, recent commits, new deps, config changes, env differences.
4. **Trace data flow** - where does the bad value originate? Trace backward from symptom to source.
5. **Multi-component systems** - add diagnostic logging at each boundary BEFORE fixing. Run once. See WHERE it breaks.

## Phase 2: Pattern Analysis

1. **Find working examples** - similar working code in the same codebase.
2. **Compare** - what's different between working and broken? List every difference.
3. **Check dependencies** - what settings, config, environment does this assume?

## Phase 3: Hypothesis and Test

1. **State hypothesis** - "I think X is the root cause because Y." Be specific.
2. **Test minimally** - smallest possible change. One variable at a time.
3. **Verify** - did it work? If not, form NEW hypothesis. Don't stack fixes.

## Phase 4: Fix

1. **Fix the root cause, not the symptom.**
2. **One change at a time.** No "while I'm here" improvements.
3. **Verify** - original issue resolved? No regressions?

## The 3-Fix Rule

If 3 fixes have failed:

**STOP. Question the architecture.**

Signals of an architectural problem:
- Each fix reveals new coupling in a different place
- Fixes require "massive refactoring"
- Each fix creates new symptoms elsewhere

This is NOT a failed hypothesis. This is a wrong approach. Step back, explain what's happening, and propose a fundamentally different angle.

## Red Flags (STOP and return to Phase 1)

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see"
- "I don't fully understand but this might work"
- "Let me add multiple changes and run tests"
- "One more fix attempt" (when already tried 2+)

## Don't Do This

- Don't propose fixes before completing Phase 1
- Don't make multiple changes at once (can't isolate what worked)
- Don't skip reading error messages completely
- Don't assume "that can't matter" about differences you find
- Don't keep trying the same approach with minor variations
- Don't say "I see the problem" when you see the symptom, not the cause
