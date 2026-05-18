---
name: creative-motion-reference
description: Reference material for creative UI motion and interaction design. Disney's 12 principles applied to web, interaction design patterns, and 2026 design trends. Use when generating animations, transitions, or creative UI concepts.
---

# Creative Motion & Interaction Reference

## Disney's 12 Principles Applied to Web UI

### 1. Squash & Stretch
Objects have mass. When a button is pressed, it compresses slightly. When released, it overshoots and settles. Use `scale` transforms — never change width/height directly.
- Button press: `scale(0.95)` → `scale(1.02)` → `scale(1)`
- Card drop: slight horizontal stretch on landing

### 2. Anticipation
Movement is preceded by a build-up. Before a modal opens, the trigger element shrinks slightly. Before a list item is removed, it tilts or lifts.
- Delete: item lifts 2px, pauses 100ms, then slides out
- Navigation: current page shrinks 2% before transition begins

### 3. Staging
Direct attention. When something important happens, everything else dims or stills. Use backdrop blur, opacity reduction, or motion freeze on surrounding elements.
- Modal: background blurs + darkens, content scales up from 95%
- Toast: all other animations pause while notification is visible

### 4. Straight-Ahead vs Pose-to-Pose
CSS keyframes = pose-to-pose (define key states, browser interpolates). Use `steps()` for frame-by-frame effects (loading spinners, sprite animations).
- Smooth transitions: `transition` with easing
- Mechanical/digital feel: `steps(8)` timing function

### 5. Follow-Through & Overlapping Action
Not everything stops at the same time. When a card lands, its shadow arrives 50ms later. When a menu closes, items stagger out (last in, first out).
- List stagger: each item delays 40-80ms after the previous
- Overshoot: element passes target by 3-5%, then settles back

### 6. Slow In & Slow Out (Easing)
Nothing starts or stops instantly. The most important creative choice in motion design.
- Enter: `cubic-bezier(0.22, 1, 0.36, 1)` — fast start, gentle settle (Apple-like)
- Exit: `cubic-bezier(0.4, 0, 1, 1)` — accelerates away
- Bounce: `cubic-bezier(0.34, 1.56, 0.64, 1)` — overshoots then returns
- Dramatic: `cubic-bezier(0.7, 0, 0.3, 1)` — slow start, slow end, fast middle

### 7. Arcs
Natural motion follows curves, not straight lines. Elements should enter/exit along arcs, not linear paths.
- Dropdown items: slight arc as they fan out
- Page transitions: content arcs up-and-over, not just left-right
- Use `offset-path` or combined X/Y transforms with different easings

### 8. Secondary Action
The main action is supported by smaller complementary motions. A button click ripples. A card flip casts a moving shadow. A page load triggers particle effects.
- Button: ripple effect from click point
- Success: checkmark draws itself + confetti particles
- Error: shake + subtle red pulse on border

### 9. Timing
Duration communicates weight and importance.
- Micro-interactions: 100-200ms (instant feel)
- Standard transitions: 200-400ms (noticeable but not slow)
- Dramatic reveals: 400-800ms (cinematic, use sparingly)
- Page transitions: 300-500ms (fast enough to not block, slow enough to register)
- **Rule:** if the user is waiting, keep it under 300ms. If you're creating atmosphere, go longer.

### 10. Exaggeration
Amplify to communicate. A notification doesn't just appear — it bounces in. An error doesn't just show red — the input shakes. Subtle exaggeration makes interfaces feel alive without being cartoonish.
- Scale: 5-15% overshoot on enter
- Rotation: 2-5° tilt on hover for playfulness
- Distance: move 20-40px instead of 8px for dramatic reveals

### 11. Solid Drawing (Depth & Perspective)
Maintain 3D consistency. If elements have shadows, those shadows should move with the light source. If cards tilt on hover, the perspective should be consistent.
- `perspective: 1000px` on parent for 3D transforms
- Shadows grow/soften as elements "lift" toward the viewer
- Parallax: background moves slower than foreground (0.5x vs 1x)

### 12. Appeal
The sum of all choices. Appeal comes from consistency, intentionality, and surprise. One well-crafted animation > ten generic ones.
- Pick ONE signature motion for the brand (e.g., "everything enters from below with a slight bounce")
- Repeat it consistently across all interactions
- Break the pattern once for maximum impact (the most important CTA does something different)

---

## Interaction Design Patterns (from Moggridge/IDEO)

### Core Principles
- **Progressive disclosure** — reveal complexity gradually, not all at once
- **Direct manipulation** — users should feel they're touching the thing, not operating a remote control
- **Feedback loops** — every action gets an immediate, proportional response
- **Forgiveness** — make it easy to undo, hard to destroy
- **Consistency** — same action = same result everywhere

### The Three Stages of Interaction
1. **Feedforward** — what will happen if I do this? (hover states, affordances, cursor changes)
2. **Action** — I'm doing it (active states, progress indicators, haptic response)
3. **Feedback** — it happened (success states, confirmation, state change)

### Physical Metaphors That Work in Digital
| Physical | Digital Translation |
|----------|-------------------|
| Weight/gravity | Heavier elements fall faster, lighter ones float |
| Friction | Drag resistance, scroll deceleration |
| Elasticity | Overshoot and bounce-back |
| Magnetism | Snap-to-grid, attraction to edges |
| Liquid | Morphing shapes, flowing transitions |
| Paper | Fold, flip, tear, stack, shuffle |
| Breath | Pulse, expand/contract rhythmically |

---

## 2026 Web Design Trends (Creative Patterns)

### Meaningful Interactions
- **Dynamic cursors** — dot, following, flashlight, text, trailing effects
- **Micro-interactions** — triggers, rules, feedback, loops at every touchpoint
- **Scroll-driven narratives** — content reveals tied to scroll position

### Hero Area Patterns
- Deconstructed layouts (fragmented, asymmetric, overlapping)
- Morphing animations and liquid motion
- Claymorphic 3D elements
- Full-viewport cinematic photography with parallax

### Motion Trends
- Staggered reveals on page load (the "procession" effect)
- Cursor-aware interactions (elements react to mouse position)
- Scroll-triggered state changes (not just fade-in — actual state transforms)
- Magnetic buttons (element pulls toward cursor before click)
- Elastic overscroll (content bounces at boundaries)

### Anti-Patterns (What's Stale)
- Fade-in-up on scroll (overused, feels generic)
- Parallax for parallax's sake (no narrative purpose)
- Loading spinners (use skeleton screens instead)
- Hover-only reveals on mobile-first sites
- Gratuitous particle effects with no brand connection

---

## Creative Forcing Functions

When generating design/motion concepts, apply at least ONE of these constraints to avoid generic output:

1. **Physical metaphor** — pick a material (liquid, smoke, magnetism, paper) and commit to it
2. **Emotional target** — name the feeling (tension, relief, curiosity, confidence) before choosing motion
3. **Temporal constraint** — "this must feel like it takes exactly one breath" or "faster than a blink"
4. **Sensory crossover** — "this should SOUND heavy" (even though it's silent — the visual weight implies sound)
5. **Narrative frame** — "this button is reluctant" or "this card is eager to be seen"
6. **Anti-reference** — "the opposite of what Apple would do here"
7. **Scale shift** — "imagine this at 100x size" or "imagine this is microscopic"
