import { useRef, useMemo, useEffect, Component, type ReactElement } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group } from 'three'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// ─── Error boundary ────────────────────────────────────────────────────────────
class AmbientErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? null : this.props.children }
}

// ─── Variant type ──────────────────────────────────────────────────────────────
export type AmbientVariant = 'students' | 'attendance' | 'fees' | 'trials' | 'coaches' | 'financials'

// ─── Shared float helper ───────────────────────────────────────────────────────
function useFloatRef(speed = 1) {
  const ref   = useRef<Group>(null)
  const t     = useRef(0)
  return { ref, t, speed }
}

// ─── VARIANT: students — jersey "10" (box 1 + torus 0) ───────────────────────
function StudentsScene() {
  const { ref, t } = useFloatRef()
  useFrame((_, d) => {
    if (!ref.current) return
    t.current += d
    ref.current.rotation.y  += 0.004
    ref.current.position.y   = Math.sin(t.current * 0.6) * 0.09
  })
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#00FF87', metalness: 0.3, roughness: 0.5 }), [])
  useEffect(() => () => { mat.dispose() }, [mat])
  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* "1" digit */}
      <mesh position={[-0.44, 0, 0]} material={mat}>
        <boxGeometry args={[0.17, 1.1, 0.14]} />
      </mesh>
      {/* "0" digit — torus */}
      <mesh position={[0.38, 0, 0]} material={mat}>
        <torusGeometry args={[0.33, 0.11, 8, 24]} />
      </mesh>
      {/* Wireframe overlay on "0" */}
      <mesh position={[0.38, 0, 0]}>
        <torusGeometry args={[0.33, 0.11, 8, 24]} />
        <meshBasicMaterial color="#00FF87" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

// ─── VARIANT: attendance — checkmark TubeGeometry ─────────────────────────────
function AttendanceScene() {
  const geo = useMemo(() => {
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.68,  0.06, 0),
      new THREE.Vector3(-0.16, -0.48, 0),
      new THREE.Vector3( 0.74,  0.58, 0),
    ])
    return new THREE.TubeGeometry(path, 22, 0.075, 8, false)
  }, [])
  useEffect(() => () => { geo.dispose() }, [geo])

  const ref = useRef<Group>(null)
  const t   = useRef(0)
  useFrame((_, d) => {
    if (!ref.current) return
    t.current += d
    ref.current.rotation.y  = Math.sin(t.current * 0.35) * 0.28
    ref.current.position.y  = Math.sin(t.current * 0.6) * 0.08
  })
  return (
    <group ref={ref}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#00FF87" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh geometry={geo}>
        <meshBasicMaterial color="#00FF87" wireframe transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

// ─── VARIANT: fees — spinning amber coin ──────────────────────────────────────
function FeesScene() {
  const ref = useRef<Group>(null)
  const t   = useRef(0)
  useFrame((_, d) => {
    if (!ref.current) return
    t.current += d
    ref.current.rotation.y += 0.012
    ref.current.rotation.x  = 0.38                           // tilt so face is visible
    ref.current.position.y  = Math.sin(t.current * 0.5) * 0.07
  })
  return (
    <group ref={ref}>
      {/* Main coin face */}
      <mesh>
        <cylinderGeometry args={[0.76, 0.76, 0.14, 36]} />
        <meshStandardMaterial color="#FFB800" metalness={0.88} roughness={0.1} />
      </mesh>
      {/* Rim */}
      <mesh>
        <cylinderGeometry args={[0.79, 0.79, 0.12, 36]} />
        <meshBasicMaterial color="#FFC300" wireframe transparent opacity={0.38} />
      </mesh>
      {/* Inner circle detail */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.01, 24]} />
        <meshStandardMaterial color="#E09000" metalness={1} roughness={0.04} />
      </mesh>
    </group>
  )
}

// ─── VARIANT: trials — 5-pointed star ────────────────────────────────────────
function TrialsScene() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    const pts = 5, oR = 0.72, iR = 0.3
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? oR : iR
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2
      if (i === 0) shape.moveTo(r * Math.cos(a), r * Math.sin(a))
      else         shape.lineTo(r * Math.cos(a), r * Math.sin(a))
    }
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.13, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2,
    })
    g.center()
    return g
  }, [])
  useEffect(() => () => { geo.dispose() }, [geo])

  const ref = useRef<Group>(null)
  const t   = useRef(0)
  useFrame((_, d) => {
    if (!ref.current) return
    t.current += d
    ref.current.rotation.y += 0.005
    ref.current.position.y  = Math.sin(t.current * 0.55) * 0.08
  })
  return (
    <group ref={ref}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#FFB800" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh geometry={geo}>
        <meshBasicMaterial color="#FFD050" wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

// ─── VARIANT: coaches — octahedron in ice blue ────────────────────────────────
function CoachesScene() {
  const ref = useRef<Group>(null)
  const t   = useRef(0)
  useFrame((_, d) => {
    if (!ref.current) return
    t.current += d
    ref.current.rotation.y += 0.006
    ref.current.rotation.x  = Math.sin(t.current * 0.28) * 0.18
    ref.current.position.y  = Math.sin(t.current * 0.6) * 0.08
  })
  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color="#00D4FF" metalness={0.4} roughness={0.4} transparent opacity={0.55} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.75, 0]} />
        <meshBasicMaterial color="#00D4FF" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// ─── VARIANT: financials — gold spinning coin ─────────────────────────────────
function FinancialsScene() {
  const ref = useRef<Group>(null)
  const t   = useRef(0)
  useFrame((_, d) => {
    if (!ref.current) return
    t.current += d
    ref.current.rotation.y += 0.01
    ref.current.rotation.x  = 0.4
    ref.current.position.y  = Math.sin(t.current * 0.5) * 0.07
  })
  return (
    <group ref={ref}>
      <mesh>
        <cylinderGeometry args={[0.76, 0.76, 0.16, 40]} />
        <meshStandardMaterial color="#D4A800" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.79, 0.79, 0.14, 40]} />
        <meshBasicMaterial color="#FFD700" wireframe transparent opacity={0.4} />
      </mesh>
      {/* Top face engraving */}
      <mesh position={[0, 0.085, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.01, 24]} />
        <meshStandardMaterial color="#B89000" metalness={1} roughness={0.03} />
      </mesh>
    </group>
  )
}

// ─── Scene content map ─────────────────────────────────────────────────────────
const SCENE_MAP: Record<AmbientVariant, () => ReactElement> = {
  students:   () => <StudentsScene />,
  attendance: () => <AttendanceScene />,
  fees:       () => <FeesScene />,
  trials:     () => <TrialsScene />,
  coaches:    () => <CoachesScene />,
  financials: () => <FinancialsScene />,
}

const LIGHT_COLOR: Record<AmbientVariant, string> = {
  students:   '#00FF87',
  attendance: '#00FF87',
  fees:       '#FFB800',
  trials:     '#FFB800',
  coaches:    '#00D4FF',
  financials: '#FFD700',
}

// ─── Default export (React.lazy) ───────────────────────────────────────────────
export default function AmbientBackground({ variant }: { variant: AmbientVariant }) {
  const { isMobile } = useMediaQuery()
  if (isMobile) return null

  const SceneContent = SCENE_MAP[variant]
  const lightColor   = LIGHT_COLOR[variant]

  return (
    <AmbientErrorBoundary>
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          right: 0,
          width: 210,
          height: 210,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.42,
        }}
      >
        <Canvas
          gl={{ alpha: true, antialias: false }}
          camera={{ position: [0, 0.4, 3], fov: 48 }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.25} />
          <pointLight color={lightColor} intensity={2.2} position={[2, 2, 2]} />
          <pointLight color={lightColor} intensity={0.6} position={[-2, -1, 1]} />
          <SceneContent />
        </Canvas>
      </div>
    </AmbientErrorBoundary>
  )
}
