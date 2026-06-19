---
name: r3f-drei-patterns
description: React Three Fiber and Drei best practices. Use when writing, reviewing, or optimizing R3F code. Triggers on tasks involving @react-three/fiber, @react-three/drei, zustand in 3D context, @react-three/postprocessing, or custom shaders.
inclusion: manual
lastVerified: 2026-05-26
---

# React Three Fiber & Drei Patterns

Prioritized rules for building performant R3F applications. Re-renders are the #1 performance killer.

## Critical Rules (Break These = Broken App)

### NEVER setState in useFrame

```tsx
// BAD - 60 re-renders per second
function Bad() {
  const [pos, setPos] = useState(0)
  useFrame(() => setPos(p => p + 0.01)) // NEVER
  return <mesh position-x={pos} />
}

// GOOD - mutate refs directly
function Good() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((_, delta) => { ref.current.rotation.y += delta })
  return <mesh ref={ref} />
}
```

### Always Use Delta Time

```tsx
// BAD - speed varies with frame rate
useFrame(() => { ref.current.rotation.y += 0.01 })

// GOOD - frame-rate independent
useFrame((_, delta) => { ref.current.rotation.y += 1 * delta }) // 1 rad/sec
```

### Zustand getState() in useFrame

```tsx
// BAD - subscribes to store, causes re-renders
function Bad() {
  const pos = useStore(s => s.position) // re-renders every update
  useFrame(() => { ref.current.position.copy(pos) })
}

// GOOD - zero re-renders
function Good() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    const { position } = useStore.getState()
    ref.current.position.copy(position)
  })
  return <mesh ref={ref} />
}
```

### Zustand Selectors (Outside useFrame)

```tsx
// BAD - re-renders on ANY store change
const store = useGameStore()

// GOOD - only re-renders when score changes
const score = useGameStore(s => s.score)

// GOOD - multiple values with shallow
import { shallow } from 'zustand/shallow'
const { x, y } = useGameStore(s => ({ x: s.x, y: s.y }), shallow)
```

## Performance Patterns

### Avoid Inline Objects in JSX

```tsx
// BAD - new array every render
<mesh position={[1, 2, 3]} />

// GOOD - stable reference
const POSITION = [1, 2, 3] as const
<mesh position={POSITION} />

// GOOD - individual props
<mesh position-x={1} position-y={2} position-z={3} />
```

### Isolate Animated Components

```tsx
// BAD - parent re-renders kill animation smoothness
function Scene() {
  const [score, setScore] = useState(0)
  return <><AnimatedMesh /><HUD score={score} /></>
}

// GOOD - animated mesh never re-renders from score
function Scene() {
  return <><AnimatedMesh /><HUD /></>
}
function HUD() {
  const score = useGameStore(s => s.score)
  return <Html>{score}</Html>
}
```

### InstancedMesh for Many Objects

```tsx
// For 100+ identical objects, use InstancedMesh directly
function Asteroids({ count = 2000 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      dummy.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10)
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      dummy.scale.setScalar(0.3 + Math.random() * 0.7)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [count])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial />
    </instancedMesh>
  )
}
```

### Drei Instances (Simpler API, Slightly Less Perf)

```tsx
import { Instances, Instance } from '@react-three/drei'

function Particles({ count = 500 }) {
  return (
    <Instances limit={count}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial />
      {Array.from({ length: count }, (_, i) => (
        <Instance key={i} position={[Math.random() * 10, Math.random() * 10, 0]} />
      ))}
    </Instances>
  )
}
```

### Dispose Management

```tsx
// R3F auto-disposes on unmount (good default)
// Disable for SHARED resources:
const sharedGeo = new THREE.SphereGeometry(1, 32, 32)
<mesh geometry={sharedGeo} dispose={null} />

// Disable on primitive for loaded models:
<primitive object={scene} dispose={null} />
```

### useFrame Priority (Execution Order)

```tsx
useFrame(() => { /* physics */ }, -100)   // runs first
useFrame(() => { /* animation */ }, 0)    // default
useFrame(() => { /* camera */ }, 100)     // runs last
```

### Conditional useFrame

```tsx
// Disable subscription entirely when not needed
useFrame(() => { /* animation */ }, active ? 0 : null)
```

## Canvas Setup

```tsx
<Canvas
  camera={{ position: [0, 0, 10], fov: 50 }}
  shadows
  dpr={[1, 2]}
  gl={{ antialias: true, alpha: false }}
  frameloop="always"
  onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping }}
>
```

### Adaptive Performance

```tsx
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'

<Canvas dpr={[1, 2]}>
  <AdaptiveDpr pixelated />
  <PerformanceMonitor
    onIncline={() => setDpr(2)}
    onDecline={() => setDpr(1)}
  />
</Canvas>
```

## Drei Helpers

### Html (DOM Overlays in 3D)

```tsx
import { Html } from '@react-three/drei'

function Label({ position, text }) {
  return (
    <Html position={position} center distanceFactor={10} occlude>
      <div className="label">{text}</div>
    </Html>
  )
}
```

### OrbitControls

```tsx
import { OrbitControls } from '@react-three/drei'

<OrbitControls
  enableDamping
  dampingFactor={0.05}
  minDistance={2}
  maxDistance={100}
  maxPolarAngle={Math.PI / 2}
/>
```

### Environment Lighting

```tsx
import { Environment } from '@react-three/drei'

<Environment preset="sunset" />
// Presets: apartment, city, dawn, forest, lobby, night, park, studio, sunset, warehouse
```

### useGLTF + Preloading

```tsx
import { useGLTF } from '@react-three/drei'

function Model() {
  const { scene, nodes, materials } = useGLTF('/model.glb')
  return <primitive object={scene} />
}
useGLTF.preload('/model.glb')
```

### Float (Ambient Animation)

```tsx
import { Float } from '@react-three/drei'

<Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
  <mesh>...</mesh>
</Float>
```

### Suspense Loading

```tsx
import { Suspense } from 'react'
import { useProgress, Html } from '@react-three/drei'

function Loader() {
  const { progress } = useProgress()
  return <Html center>{progress.toFixed(0)}%</Html>
}

<Canvas>
  <Suspense fallback={<Loader />}>
    <Model />
  </Suspense>
</Canvas>
```

## Shader Patterns

### shaderMaterial (Drei) - Recommended

```tsx
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const MyMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color('cyan') },
  // vertex
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  // fragment
  `uniform float time;
   uniform vec3 color;
   varying vec2 vUv;
   void main() {
     gl_FragColor = vec4(color * vUv.x, 1.0);
   }`
)
extend({ MyMaterial })

function ShaderMesh() {
  const ref = useRef()
  useFrame(({ clock }) => { ref.current.time = clock.elapsedTime })
  return (
    <mesh>
      <sphereGeometry />
      <myMaterial ref={ref} key={MyMaterial.key} />
    </mesh>
  )
}
```

The `key={MyMaterial.key}` enables HMR - shader updates without page refresh.

### Fresnel Effect (Atmosphere Glow)

```glsl
// vertex
varying vec3 vNormal;
varying vec3 vWorldPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// fragment
uniform vec3 glowColor;
uniform float intensity;
varying vec3 vNormal;
varying vec3 vWorldPosition;
void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);
  gl_FragColor = vec4(glowColor, fresnel * intensity);
}
```

### Vertex Displacement

```glsl
uniform float time;
uniform float amplitude;
void main() {
  vec3 pos = position;
  pos += normal * sin(pos.x * 5.0 + time) * amplitude;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### External GLSL Files (Vite)

```tsx
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'
// Or with vite-plugin-glsl for #include support
```

## Events & Interaction

### Pointer Events

```tsx
<mesh
  onClick={(e) => { e.stopPropagation(); handleClick(e.point) }}
  onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
  onPointerOut={() => setHovered(false)}
>
```

Event data: `e.object`, `e.point` (Vector3), `e.distance`, `e.face`, `e.uv`, `e.normal`, `e.ray`.

### Always stopPropagation

Events bubble through the scene graph. Always call `e.stopPropagation()` unless you explicitly want bubbling.

### Cursor Change on Hover

```tsx
import { useCursor } from '@react-three/drei'

function Clickable() {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return <mesh onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} />
}
```

### Disable Raycast on Decorative Objects

```tsx
// Decorative objects that shouldn't receive events:
<mesh raycast={() => null}>
```

## Post-Processing

```tsx
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

<EffectComposer>
  <Bloom luminanceThreshold={0.9} intensity={1.5} mipmapBlur />
  <Vignette offset={0.3} darkness={0.9} />
</EffectComposer>
```

### Selective Bloom (Glow Specific Objects)

```tsx
import { SelectiveBloom } from '@react-three/postprocessing'

function Scene() {
  const sunRef = useRef()
  return (
    <>
      <mesh ref={sunRef}><meshBasicMaterial color="yellow" /></mesh>
      <EffectComposer>
        <SelectiveBloom lights={[]} selection={[sunRef]} intensity={2} />
      </EffectComposer>
    </>
  )
}
```

### Skip Post-Processing on Mobile

```tsx
const isMobile = /Mobi|Android/i.test(navigator.userAgent)

{!isMobile && (
  <EffectComposer>
    <Bloom ... />
  </EffectComposer>
)}
```

## Animation Patterns

### Smooth Lerp (Damped Follow)

```tsx
useFrame((_, delta) => {
  ref.current.position.lerp(targetPosition, delta * 5)
})
```

### Spring Physics (Manual, No Library)

```tsx
const spring = useRef({ value: 0, velocity: 0 })

useFrame((_, delta) => {
  const s = spring.current
  const force = -100 * (s.value - target)
  const damping = -10 * s.velocity
  s.velocity += (force + damping) * delta
  s.value += s.velocity * delta
  ref.current.position.y = s.value
})
```

### @react-spring/three

```tsx
import { useSpring, animated } from '@react-spring/three'

function AnimatedBox() {
  const [active, setActive] = useState(false)
  const { scale } = useSpring({ scale: active ? 1.5 : 1 })
  return (
    <animated.mesh scale={scale} onClick={() => setActive(!active)}>
      <boxGeometry />
      <meshStandardMaterial />
    </animated.mesh>
  )
}
```

## Lighting & Shadows

```tsx
// Shadows: enable on Canvas, light, and meshes
<Canvas shadows>
  <directionalLight
    castShadow
    position={[5, 10, 5]}
    shadow-mapSize={[2048, 2048]}
    shadow-camera-far={50}
    shadow-camera-left={-10}
    shadow-camera-right={10}
  />
  <mesh castShadow><boxGeometry /><meshStandardMaterial /></mesh>
  <mesh receiveShadow rotation-x={-Math.PI / 2}><planeGeometry args={[50, 50]} /></mesh>
</Canvas>
```

### PointLight Shadows (Expensive)

PointLight uses a CubeMap (6 render passes). Use sparingly. Prefer DirectionalLight or SpotLight for shadows.

## State Management (Zustand for R3F)

```tsx
import { create } from 'zustand'

const useStore = create((set, get) => ({
  bodies: [],
  paused: false,
  selectedId: null,
  // Actions
  select: (id) => set({ selectedId: id }),
  togglePause: () => set(s => ({ paused: !s.paused })),
  // Frame-loop safe: mutate in place, no set() needed for positions
  updatePositions: (newPositions) => {
    const bodies = get().bodies
    bodies.forEach((b, i) => { b.position = newPositions[i] })
  },
}))
```

## Don't Do This

- Don't call `setState` or `set()` inside `useFrame` for values that change every frame
- Don't subscribe to entire Zustand store (`useStore()` with no selector)
- Don't create new objects/arrays in JSX props (`position={[x, y, z]}` in render)
- Don't use `react-spring/three` for things that update every frame (use refs + lerp)
- Don't put heavy computation inside `useFrame` (precompute or throttle)
- Don't forget `e.stopPropagation()` on pointer events
- Don't use PointLight shadows when DirectionalLight works (6x cost)
- Don't render `<Html>` for every object simultaneously (DOM overhead)
- Don't skip `dispose={null}` on shared geometries/materials
- Don't use `frameloop="demand"` when you have continuous animations
- Don't forget `Suspense` around components that use `useGLTF`/`useTexture`
- Don't use Drei `<Instances>` for 2000+ objects (use raw `instancedMesh` directly)
