---
sync: draft
lastLocalEdit: 2026-05-19T22:26:00+12:00
---

# Creative Kit - Reusable Component + Animation Library

Status: Parked
Date discussed: 2026-05-19

## The Idea

A personal reusable component + animation library for R3F/creative projects. Two decoupled layers:
1. Components (static 3D objects/UI elements, customisable look via props/theme)
2. Animations (composable motion wrappers, applied to any component)

## Key Decisions

- GSAP as the animation engine (strongest for R3F + DOM + timelines)
- Declarative wrapper API: `<Animated enter={} rest={} exit={} onHover={} />`
- Three animation states: enter (mount), rest (idle), exit (unmount/deactivate)
- Sub-component animations supported (typewriter on title, fade on description)
- Exit can be triggered by unmount OR active prop toggle
- Look/feel always overridable via props - structure and motion are fixed, skin is flexible
- Playground for directing/approving each piece in isolation

## Architecture

```
creative-kit/
├── components/     ← Card3D, GlassPanel, TextBlock (static, themeable)
├── animations/     ← springEnter, float, typewriter, fadeOut (composable)
├── presets/        ← pre-combined component+animation combos
└── playground/     ← preview/approve each piece
```

## Mobile Camera Concept

- Desktop: fixed/orbit camera
- Mobile: gyroscope-driven camera (phone = viewport into scene)
- Same R3F scene, conditional camera controller based on device
- DeviceOrientation API for rotation, on-screen joystick for movement

## Creative Direction Process

- ChatGPT generates scene image → user annotates → user describes behaviour → implement
- Component by component, user directs each one
- Storyboard script for motion concepts before implementation
- Physical metaphors over technical specs for animation direction

## Next Steps (when unparked)

- First entries could be refactored from agent-forge carousel (carousel-3d, typewriter-text)
- Needs proper project setup (repo, package structure, playground)
