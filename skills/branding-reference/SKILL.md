---
name: branding-reference
description: Create a living brand reference (React pages) before any feature implementation on greenfield projects. Use when starting a new project, establishing a design system, or when the user says "I don't know what it looks like yet." Produces deployable pages showing typography, colors, components, and interactions for user approval.
inclusion: manual
lastVerified: 2026-05-16
---

# Branding Reference

Before building any feature page on a greenfield project, produce a living style guide the user can see and approve in a browser.

## When to Use

- New project with no existing design system
- User provides mood/direction but no visual reference
- @designer has produced a design direction doc but no rendered output
- User says "I don't know what it looks like" or "show me before you build"

## Iron Law

```
NO FEATURE PAGES BEFORE THE BRAND REFERENCE IS APPROVED.
```

The brand reference is the visual contract. Everything built after it must match.

## Output Structure

Create pages at a route the user can view (e.g., `/brand` or `/design-system`):

```
app/(brand)/
├── layout.tsx          ← minimal layout, no auth
├── page.tsx            ← overview / index
├── typography/page.tsx ← all type styles rendered
├── colors/page.tsx     ← palette swatches + usage
├── components/page.tsx ← all UI components in states
└── motion/page.tsx     ← animations + interactions
```

## Page 1: Typography

Show every text style at actual rendered size:

- Display / Hero heading (largest)
- H1, H2, H3, H4, H5, H6
- Body (default paragraph)
- Body small / caption
- Monospace / code
- Link styles (default, hover, visited)
- Font loading demonstration (show the actual fonts, not system fallbacks)

Include: font family names, weights used, line heights, letter spacing.

## Page 2: Colors

For each color token:
- Swatch (large enough to judge)
- Token name (e.g., `--color-primary`)
- Hex/HSL value
- Contrast ratio against white and black
- Usage note ("headings", "backgrounds", "accents")

Show:
- Primary palette
- Neutral/gray scale
- Semantic colors (success, warning, error, info)
- Dark mode variants (if applicable)

## Page 3: Components

Render every component the project will use, in ALL states:

| Component | States to Show |
|-----------|---------------|
| Button | default, hover, active, disabled, loading, sizes (sm/md/lg) |
| Input | empty, focused, filled, error, disabled |
| Card | default, hover, with/without image |
| Badge | all variants (default, success, warning, error) |
| Select/Dropdown | closed, open, with selection |
| Table | with data, empty state, loading |
| Modal/Dialog | open state |
| Toast/Notification | all variants |
| Navigation | desktop, mobile |
| Loading states | skeleton, spinner, progress |

Use the project's actual component library (shadcn, custom, etc.).

## Page 4: Motion & Interactions

**Write motion as narrative first, specs second.**

Describe every animation as a scene — how it FEELS to watch, not just what moves. The narrative is the source of truth. If the code doesn't match the feeling described, the code is wrong.

Example format:
```
### Card Entrance
**Narrative:** The cards don't just appear — they arrive. Each one rises from 
below like surfacing from deep water. The first is bold, immediate. The second 
follows a half-beat later, slightly slower, as if pulled by the first. By the 
third, there's a rhythm — a procession, not a dump.

**Specs:** translateY(24px→0), opacity(0→1), stagger 80ms, duration 400ms, 
easing: cubic-bezier(0.22, 1, 0.36, 1)
```

Demonstrate with live examples:

- Page transition (navigate between brand pages to show it)
- Hover effects on interactive elements
- Scroll-triggered animations (if used)
- Loading/skeleton transitions
- Micro-interactions (button press, toggle, expand/collapse)
- Timing/easing reference (show the same animation at different speeds)

## Process

1. Read the design direction doc (if exists)
2. Create a `DESIGN.md` in the project root following the Google Stitch format (see template below)
3. User reviews DESIGN.md — approves or adjusts tokens/choices
4. Create the brand route structure
5. Implement all 4 pages rendering the DESIGN.md tokens as live components
6. Deploy locally (dev server)
7. Present URL to user: "Brand reference is at localhost:XXXX/brand — review and tell me what to change"
8. Iterate based on feedback
9. Once approved, this becomes the implementation reference for all feature pages

## DESIGN.md Template

Create this in the project root. Fill in project-specific values. Reference: https://github.com/VoltAgent/awesome-design-md

```markdown
# DESIGN.md

## Visual Theme & Atmosphere
- Mood: [e.g., dark cinematic, warm minimal, brutalist, editorial]
- Density: [spacious / balanced / dense]
- Philosophy: [1-2 sentences on the design intent]

## Color Palette & Roles
| Token | Hex | Role |
|-------|-----|------|
| --color-primary | #XXXXXX | Primary actions, links |
| --color-accent | #XXXXXX | Highlights, badges |
| --color-background | #XXXXXX | Page background |
| --color-surface | #XXXXXX | Card/panel backgrounds |
| --color-text | #XXXXXX | Body text |
| --color-muted | #XXXXXX | Secondary text, borders |
| --color-success | #XXXXXX | Success states |
| --color-warning | #XXXXXX | Warning states |
| --color-error | #XXXXXX | Error states |

## Typography Rules
| Level | Font | Weight | Size | Line Height | Letter Spacing |
|-------|------|--------|------|-------------|----------------|
| Display | | | | | |
| H1 | | | | | |
| H2 | | | | | |
| H3 | | | | | |
| Body | | | | | |
| Caption | | | | | |
| Mono | | | | | |

## Component Stylings
### Buttons
- Primary: [bg, text, border-radius, padding, hover state]
- Secondary: [...]
- Ghost: [...]

### Inputs
- Default: [border, bg, focus ring, placeholder color]
- Error: [border color, message style]

### Cards
- Default: [bg, border, shadow, radius, padding]
- Hover: [transform, shadow change]

## Layout Principles
- Max width: [e.g., 1200px]
- Grid: [columns, gap]
- Spacing scale: [4px base? 8px base?]
- Section padding: [vertical rhythm]

## Depth & Elevation
- Level 0: [flat, no shadow]
- Level 1: [subtle shadow for cards]
- Level 2: [dropdown/popover shadow]
- Level 3: [modal/dialog shadow]

## Motion & Interactions
- Page transitions: [type, duration, easing]
- Hover effects: [what happens on interactive elements]
- Scroll animations: [reveal type, trigger point]
- Loading states: [skeleton style, spinner style]
- Easing: [default curve, e.g., cubic-bezier(0.4, 0, 0.2, 1)]

## Responsive Behavior
- Breakpoints: [sm, md, lg, xl]
- Mobile navigation: [hamburger? bottom nav? slide-in?]
- Touch targets: [minimum size]

## Do's and Don'ts
### Do
- [...]

### Don't
- [...]
```

Use the `awesome-design-md` collection (https://github.com/VoltAgent/awesome-design-md) for inspiration. Pick a DESIGN.md from a site with a similar vibe to what the user wants, then customize it.

## Boilerplate

Every new project starts with this exact structure. The skill provides the skeleton; @designer fills it with project-specific choices. Don't skip pages. Don't combine them. Each page serves a different review purpose.

## After Approval

- The brand pages STAY in the project (they're documentation)
- @frontend references these pages when implementing features
- Any design drift (feature doesn't match brand reference) is a bug
- Brand reference can evolve, but changes need user approval

## Component Inventory Rule

The brand reference `/components` page is the **single source of truth** for available UI components.

**When building a feature page:**
1. Check if all needed components exist in the brand reference
2. If YES → implement using those exact components
3. If NO → update the brand reference FIRST (add the new component with all states), get user approval, THEN use it in the feature

This prevents: inventing one-off components that don't match the system, inconsistent styling across pages, and "where did this button style come from?" confusion.

**The flow:**
```
Feature needs a DatePicker → not in brand reference
→ @designer adds DatePicker to /brand/components (all states)
→ User approves the look
→ @frontend implements the feature using that approved DatePicker
```

## Don't Do This

- Don't build feature pages before brand reference is approved
- Don't describe the design in markdown only — render it
- Don't use placeholder fonts ("we'll pick later") — commit to real fonts now
- Don't skip the motion page ("we'll add animations later") — motion IS the brand
- Don't show components without all states — partial demos hide problems
- Don't use generic color names ("blue") — use semantic tokens from day one
