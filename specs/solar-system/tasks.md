---
status: approved
approvedBy: Archangel
approvedDate: 2026-05-26
---

# Tasks — 3D Educational Solar System (Sol)

## Task 1: Scaffold Vite + R3F Project

**Description:** Initialize Vite project with React 19, R3F 9, Drei 9, Zustand 5, Three.js r170+. TypeScript strict. Render rotating cube to prove pipeline.

**AC:**
- `npm run dev` starts without errors
- Canvas element renders in DOM with visible 3D object
- Pinned deps: react@19, @react-three/fiber@9, @react-three/drei@9, zustand@5, three@>=0.170
- `tsconfig.json` has `"strict": true`
- `npm run build` produces `dist/` with zero type errors

**Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`
**Deps:** None

---

## Task 2: Zustand Store + Planet Data Constants

**Description:** Zustand store with simulation state. Planet data with real orbital elements and physical data for 8 planets + Sun. Interior layer data.

**AC:**
- `useStore.getState()` returns full typed state
- `planets.ts` exports 9 bodies with: name, semiMajorAxis, eccentricity, orbitalPeriod, radius, mass, surfaceGravity (within 1% of NASA)
- `layers.ts` exports interior layers for all 8 planets (min 3 each)
- Store actions all callable and update state

**Files:** `src/store.ts`, `src/data/planets.ts`, `src/data/layers.ts`
**Deps:** Task 1

---

## Task 3: Keplerian Orbit Solver + Scale Transform

**Description:** Kepler's equation solver (Newton-Raphson). Display scale transforms. Pure functions.

**AC:**
- `solveKepler(M, e)` converges within 10 iterations for e < 0.9
- `getOrbitalPosition(planet, t)` deterministic (same input = same output, no drift)
- `scaleDistance(au)` maps Mercury–Neptune into [2, 50] scene units
- `scaleRadius(km)` maps radii into [0.3, 2.5] scene units
- All pure functions, no side effects

**Files:** `src/physics/kepler.ts`, `src/physics/constants.ts`, `src/physics/scale.ts`
**Deps:** Task 2

---

## Task 4: Sun + Planets Rendering with Orbits

**Description:** Sun with glow shader at origin. 8 planets at Kepler positions. Orbit trail lines. Driven by useFrame + store.

**AC:**
- 9 mesh objects in scene (Sun + 8 planets)
- Planets move on elliptical paths when playing
- 8 orbit trail Lines visible
- Sun has custom ShaderMaterial
- Shared SphereGeometry (1 instance for all planets)
- Frame time < 16ms desktop

**Files:** `src/scene/SolarSystem.tsx`, `src/scene/Planet.tsx`, `src/scene/Sun.tsx`, `src/scene/OrbitTrail.tsx`, `src/scene/Lighting.tsx`, `src/shaders/*`, `src/hooks/useSimulation.ts`
**Deps:** Task 3

---

## Task 5: Constrained Camera + Planet Selection

**Description:** CameraRig with predefined viewpoints. Click planet → animated transition. Home button resets.

**AC:**
- Click planet updates store.selectedPlanet
- Camera animates over 0.8-1.2s (lerp)
- Home button resets to overview
- Camera always within bounds
- Double-click reserved (doesn't trigger camera)
- Touch events work

**Files:** `src/scene/CameraRig.tsx`, `src/ui/HomeButton.tsx`
**Deps:** Task 4

---

## Task 6: Info Panel + Hover Tooltip

**Description:** React overlay panel with scientific data. Drei Html tooltip on hover.

**AC:**
- InfoPanel shows name, mass, radius, period, gravity, moons
- Deselect removes panel
- Hover shows tooltip with planet name
- InfoPanel outside Canvas in DOM
- Accessible (semantic HTML, aria-labels)
- Panel ≤ 40% viewport width on tablet

**Files:** `src/ui/InfoPanel.tsx`, `src/ui/Tooltip.tsx`
**Deps:** Task 5

---

## Task 7: Time Controls + Day/Night Lighting

**Description:** Time speed slider + play/pause. DirectionalLight tracks sun direction.

**AC:**
- Slider min=0.1, max=100
- Slider updates store.timeSpeed
- Play/pause toggles store.isPlaying
- DirectionalLight target follows selected planet
- ambientLight intensity = 0.02
- Aria-labels on controls

**Files:** `src/ui/TimeControls.tsx`, `src/scene/Lighting.tsx` (mod)
**Deps:** Task 4

---

## Task 8: Asteroid Belt (InstancedMesh)

**Description:** InstancedMesh ring between Mars and Jupiter. Adapts count to device.

**AC:**
- InstancedMesh with count >= 1000
- Positions within Mars-Jupiter orbital band
- frustumCulled = true
- raycast disabled
- Count adapts (1000 tablet, 2000 desktop)
- No frame rate regression

**Files:** `src/scene/AsteroidBelt.tsx`
**Deps:** Task 4

---

## Task 9: Exploded Layer View

**Description:** Double-click selected planet → layers separate with spring animation. Labels per layer.

**AC:**
- Double-click sets viewMode = 'exploded'
- Layers animate outward over 0.5-1s
- Each layer has Html label
- Layer count matches layers.ts
- Double-click again collapses
- Other planets dimmed during exploded view

**Files:** `src/scene/ExplodedView.tsx`, `src/scene/Planet.tsx` (mod), `src/store.ts` (mod)
**Deps:** Task 6

---

## Task 10: Guided Narration + Subtitles

**Description:** HTML5 Audio hook. Planet selection triggers narration. Subtitles visible during playback.

**AC:**
- useAudio exposes play/stop/isPlaying
- Selecting planet triggers audio
- Subtitles render during playback
- Audio stops on deselect
- Placeholder .mp3 files in public/audio/

**Files:** `src/hooks/useAudio.ts`, `src/ui/Subtitles.tsx`, `public/audio/*.mp3`
**Deps:** Task 6

---

## Task 11: Responsive + Performance Optimization

**Description:** AdaptiveDpr. Tablet detection. Touch targets. 30fps guarantee.

**AC:**
- AdaptiveDpr in Canvas
- Viewport < 1024: asteroids ≤ 1000, buttons ≥ 48px
- Touch targets ≥ 44px on tablet
- No frame > 33ms on 4x CPU throttle
- Atmosphere shader simplified on tablet
- No horizontal scroll at 768px

**Files:** Multiple (App, Planet, AsteroidBelt, HomeButton)
**Deps:** Tasks 8, 9, 10

---

## Task 12: Integration Polish + Final QA

**Description:** Full flow verification. Fix glitches. Loading state. Accessibility.

**AC:**
- Full flow completable without console errors
- Suspense loading fallback present
- No z-fighting (orbit trail renderOrder set)
- Rapid clicking doesn't leave stale state
- Zero TS errors, zero console warnings in prod build
- Lighthouse accessibility ≥ 90

**Files:** All (review + fix)
**Deps:** Task 11

---

## Dependency Graph

```
T1 → T2 → T3 → T4 → T5 → T6 → T9
                  ↓         ↓
                  T7        T10
                  ↓
                  T8
                       ↓
                 T11 (T8+T9+T10)
                       ↓
                      T12
```
