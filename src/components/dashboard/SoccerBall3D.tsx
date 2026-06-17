import { Component, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Group } from 'three'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// ─── Shared mouse parallax position (updated outside Canvas) ─────────────────
const _mousePos = { x: 0, y: 0 }

// ─── Error boundary ────────────────────────────────────────────────────────────
interface EBState { hasError: boolean }
class BallErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false }
  static getDerivedStateFromError(): EBState { return { hasError: true } }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// ─── Ball + comet trail (combined to share position state) ────────────────────
const TRAIL_LEN = 5

function BallAndTrail() {
  const groupRef  = useRef<Group>(null)
  const burstRef  = useRef(false)
  const timerRef  = useRef<ReturnType<typeof setTimeout>>(undefined)
  const elapsed   = useRef(0)

  // Circular position buffer for trail
  const histBuf  = useRef<[number, number, number][]>(
    Array.from({ length: TRAIL_LEN }, () => [0, 0, 0] as [number, number, number])
  )
  const histHead  = useRef(0)
  const dotRefs   = useRef<(THREE.Mesh | null)[]>(Array(TRAIL_LEN).fill(null))

  useEffect(() => () => { clearTimeout(timerRef.current) }, [])

  const triggerBurst = () => {
    burstRef.current = true
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { burstRef.current = false }, 500)
  }

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    elapsed.current += delta
    const burst = burstRef.current

    g.rotation.y += burst ? 0.022 : 0.005
    g.rotation.x += burst ? 0.006 : 0.0012

    // Lerp toward mouse-influenced target position
    const tx = _mousePos.x * 0.45
    const ty = Math.sin(elapsed.current * 0.75) * 0.15 + _mousePos.y * 0.22
    g.position.x = THREE.MathUtils.lerp(g.position.x, tx, 0.04)
    g.position.y = THREE.MathUtils.lerp(g.position.y, ty, 0.06)

    // Write current position into circular buffer
    const slot = histBuf.current[histHead.current]
    slot[0] = g.position.x
    slot[1] = g.position.y
    slot[2] = g.position.z
    histHead.current = (histHead.current + 1) % TRAIL_LEN

    // Update trail dot world positions + fade
    dotRefs.current.forEach((dot, i) => {
      if (!dot) return
      const idx = (histHead.current - 1 - i + TRAIL_LEN) % TRAIL_LEN
      const [x, y, z] = histBuf.current[idx]
      dot.position.set(x, y, z)
      ;(dot.material as THREE.MeshBasicMaterial).opacity =
        (1 - (i + 1) / (TRAIL_LEN + 1)) * 0.3
    })
  })

  return (
    <>
      {/* Ball */}
      <group ref={groupRef} onClick={triggerBurst} onPointerDown={triggerBurst}>
        {/* Dark low-poly surface */}
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#0A0A0F" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* Green wireframe — bloomed */}
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#00FF87" wireframe transparent opacity={0.4} />
        </mesh>
        {/* Inner glow — additive blend for soft edge luminance */}
        <mesh>
          <icosahedronGeometry args={[1.03, 1]} />
          <meshBasicMaterial
            color="#00FF87"
            transparent
            opacity={0.065}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Trail dots — world-space siblings (not children of ball group) */}
      {Array.from({ length: TRAIL_LEN }).map((_, i) => (
        <mesh key={i} ref={el => { dotRefs.current[i] = el }}>
          <sphereGeometry args={[0.04 - i * 0.005, 4, 4]} />
          <meshBasicMaterial color="#00FF87" transparent opacity={0.28} />
        </mesh>
      ))}
    </>
  )
}

// ─── Default export (consumed via React.lazy in DashboardPage) ───────────────
export default function SoccerBall3D() {
  const { isMobile } = useMediaQuery()

  // Register mouse parallax (desktop only, must be before early return)
  useEffect(() => {
    if (isMobile) return
    const onMove = (e: MouseEvent) => {
      _mousePos.x = (e.clientX / window.innerWidth - 0.5) * 2
      _mousePos.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [isMobile])

  if (isMobile) return null

  return (
    <BallErrorBoundary>
      <div style={{ width: 280, height: 280 }}>
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0, 4], fov: 45 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.3} />
          <pointLight color="#00FF87" intensity={1.5} position={[3, 3, 3]} />
          <pointLight color="#00D4FF" intensity={0.8} position={[-3, -3, 3]} />

          <BallAndTrail />

          <EffectComposer>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.025}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </div>
    </BallErrorBoundary>
  )
}
