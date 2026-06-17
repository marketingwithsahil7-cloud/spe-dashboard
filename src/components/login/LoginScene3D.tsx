import { useRef, useMemo, useEffect, Component } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Group } from 'three'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// ─── Error Boundary ────────────────────────────────────────────────────────────
class SceneErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// ─── Scene fog setup ───────────────────────────────────────────────────────────
function SceneSetup() {
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#0A0A0F', 0.038)
    return () => { scene.fog = null }
  }, [scene])
  return null
}

// ─── Floating Particles ────────────────────────────────────────────────────────
function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)

  const { pos, vel } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 14
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7
      vel[i]         = 0.0028 + Math.random() * 0.0065
    }
    return { pos, vel }
  }, [count])

  useFrame(() => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const arr  = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += vel[i]
      if (arr[i * 3 + 1] > 5.5) arr[i * 3 + 1] = -4.5
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#00FF87" size={0.022} transparent opacity={0.48} sizeAttenuation />
    </points>
  )
}

// ─── Soccer Ball ───────────────────────────────────────────────────────────────
function BallMesh() {
  const ref     = useRef<Group>(null)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    if (!ref.current) return
    elapsed.current += delta
    ref.current.rotation.y += 0.005
    ref.current.rotation.x += 0.0012
    ref.current.position.y  = Math.sin(elapsed.current * 0.75) * 0.1
  })

  return (
    <group ref={ref} position={[0, 0.1, 0.8]}>
      <mesh>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshStandardMaterial color="#0A0A0F" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshBasicMaterial color="#00FF87" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// ─── Goal Post ─────────────────────────────────────────────────────────────────
function GoalPost() {
  const W = 3.0, H = 1.85, D = 0.85, R = 0.044

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#D0D0D0', metalness: 0.85, roughness: 0.15,
  }), [])
  useEffect(() => () => { mat.dispose() }, [mat])

  type P = { pos: [number, number, number]; rot: [number, number, number]; h: number }
  const posts = useMemo<P[]>(() => [
    { pos: [-W / 2, H / 2,  0],   rot: [0, 0, 0],          h: H },
    { pos: [ W / 2, H / 2,  0],   rot: [0, 0, 0],          h: H },
    { pos: [ 0,     H,      0],   rot: [0, 0, Math.PI / 2], h: W },
    { pos: [-W / 2, H / 2, -D],   rot: [0, 0, 0],          h: H },
    { pos: [ W / 2, H / 2, -D],   rot: [0, 0, 0],          h: H },
    { pos: [ 0,     H,     -D],   rot: [0, 0, Math.PI / 2], h: W },
    { pos: [-W / 2, H,    -D / 2], rot: [Math.PI / 2, 0, 0], h: D },
    { pos: [ W / 2, H,    -D / 2], rot: [Math.PI / 2, 0, 0], h: D },
  ], [])

  return (
    <group position={[0.4, -1.2, -3.2]}>
      {posts.map(({ pos, rot, h }, i) => (
        <mesh key={i} position={pos} rotation={rot} material={mat}>
          <cylinderGeometry args={[R, R, h, 8]} />
        </mesh>
      ))}

      {/* Back net */}
      <mesh position={[0, H / 2, -D - 0.01]}>
        <planeGeometry args={[W, H, 13, 9]} />
        <meshBasicMaterial color="#00FF87" wireframe transparent opacity={0.075} side={THREE.DoubleSide} />
      </mesh>

      {/* Top net */}
      <mesh position={[0, H + 0.01, -D / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D, 13, 5]} />
        <meshBasicMaterial color="#00FF87" wireframe transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── Soccer Field ──────────────────────────────────────────────────────────────
function SoccerField() {
  const lineGeo = useMemo(() => {
    const pts: number[] = []

    // Center circle
    const segs = 36, r = 0.9
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * Math.PI * 2
      const a2 = ((i + 1) / segs) * Math.PI * 2
      pts.push(Math.cos(a1) * r, 0, Math.sin(a1) * r, Math.cos(a2) * r, 0, Math.sin(a2) * r)
    }

    // Penalty box
    const bW = 3.8, bD = 1.6, bZ = 0.6
    pts.push(-bW / 2, 0, bZ,      bW / 2, 0, bZ)
    pts.push(-bW / 2, 0, bZ,     -bW / 2, 0, bZ - bD)
    pts.push( bW / 2, 0, bZ,      bW / 2, 0, bZ - bD)
    pts.push(-bW / 2, 0, bZ - bD, bW / 2, 0, bZ - bD)

    // Center spot
    pts.push(-0.05, 0, 0, 0.05, 0, 0)
    pts.push(0, 0, -0.05, 0, 0, 0.05)

    // Wide center line
    pts.push(-7, 0, 0, 7, 0, 0)

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  useEffect(() => () => { lineGeo.dispose() }, [lineGeo])

  return (
    <group>
      {/* Ground */}
      <mesh position={[0, -1.2, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial color="#050D05" roughness={0.95} metalness={0} />
      </mesh>

      {/* Line markings */}
      <lineSegments geometry={lineGeo} position={[0, -1.19, -1.2]}>
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0.1} />
      </lineSegments>
    </group>
  )
}

// ─── Subtle camera sway ────────────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    camera.position.x = Math.sin(t.current * 0.11) * 0.22
    camera.position.y = 1.5 + Math.sin(t.current * 0.07) * 0.09
    camera.lookAt(0, 0.1, -0.5)
  })

  return null
}

// ─── Default export (React.lazy) ───────────────────────────────────────────────
export default function LoginScene3D() {
  const { isMobile } = useMediaQuery()
  const count = isMobile ? 60 : 200

  return (
    <SceneErrorBoundary>
      <Canvas
        gl={{ alpha: true, antialias: !isMobile }}
        camera={{ position: [0, 1.5, 6], fov: 45 }}
        style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }}
      >
        <SceneSetup />

        {/* Lighting */}
        <ambientLight color="#002200" intensity={0.65} />
        <pointLight color="#00FF87" intensity={2.8} position={[2, 3, 2]} />
        <pointLight color="#00FF87" intensity={1.2} position={[-2, 1, 4]} />
        <pointLight color="#00D4FF" intensity={0.9} position={[-4, 3, 3]} />

        {!isMobile && <SoccerField />}
        {!isMobile && <GoalPost />}
        <BallMesh />
        <Particles count={count} />
        {!isMobile && <CameraRig />}

        <EffectComposer>
          <Bloom
            intensity={0.65}
            luminanceThreshold={0.7}
            luminanceSmoothing={0.025}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </SceneErrorBoundary>
  )
}
