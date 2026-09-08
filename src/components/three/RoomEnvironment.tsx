import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

export type LightMode = 0 | 0.5 | 1

const MORNING = {
  color: new THREE.Color('#ffd9a0'),
  sunPos: new THREE.Vector3(-6, 4.5, 5),
  intensity: 1.35,
  ambient: 0.45,
}
const AFTERNOON = {
  color: new THREE.Color('#ffffff'),
  sunPos: new THREE.Vector3(3, 8, 3),
  intensity: 1.7,
  ambient: 0.65,
}
const EVENING = {
  color: new THREE.Color('#ffb26b'),
  sunPos: new THREE.Vector3(7, 2.5, -4),
  intensity: 1.05,
  ambient: 0.32,
}

function lerpVec(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return a.clone().lerp(b, t)
}

export function SunRig({ mode }: { mode: number }) {
  const dir = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)

  useFrame((_, delta) => {
    const t = THREE.MathUtils.clamp(mode, 0, 1)
    const stage = t < 0.5 ? [MORNING, AFTERNOON] : [AFTERNOON, EVENING]
    const local = t < 0.5 ? t * 2 : (t - 0.5) * 2
    const [a, b] = stage
    const color = a.color.clone().lerp(b.color, local)
    const pos = lerpVec(a.sunPos, b.sunPos, local)
    const inten = THREE.MathUtils.lerp(a.intensity, b.intensity, local)
    const ambI = THREE.MathUtils.lerp(a.ambient, b.ambient, local)

    if (dir.current) {
      dir.current.position.lerp(pos, Math.min(1, delta * 3))
      dir.current.color.lerp(color, Math.min(1, delta * 3))
      dir.current.intensity = THREE.MathUtils.damp(dir.current.intensity, inten * 2.2, 4, delta)
    }
    if (amb.current) {
      amb.current.intensity = THREE.MathUtils.damp(amb.current.intensity, ambI, 4, delta)
    }
    if (rim.current) {
      // Rim is opposite key light for depth separation
      rim.current.position.lerp(pos.clone().multiplyScalar(-1).add(new THREE.Vector3(0, 2, 0)), Math.min(1, delta * 3))
      rim.current.color.lerp(color.clone().offsetHSL(0.02, 0, 0.1), Math.min(1, delta * 3))
    }
  })

  return (
    <>
      <ambientLight ref={amb} intensity={0.55} color="#fff6e8" />
      {/* Key: soft directional with PCFSoft shadows */}
      <directionalLight
        ref={dir}
        position={[3, 8, 3]}
        intensity={3.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* Rim / back-light for luxury depth */}
      <directionalLight ref={rim} position={[-4, 3, -6]} intensity={0.9} color="#ffe9c9" />
      {/* Soft fill to lift shadows */}
      <directionalLight ref={fill} position={[-5, 3, 4]} intensity={0.55} color="#f5efeb" />
      {/* Subtle hemisphere to simulate bounce */}
      <hemisphereLight args={['#ffedcd', '#EDE8E1', 0.35]} />
    </>
  )
}

export default function RoomEnvironment({
  intensity = 1,
  lightMode,
}: {
  intensity?: number
  lightMode?: number
}) {
  return (
    <>
      {lightMode === undefined ? (
        <>
          <ambientLight intensity={0.55 * intensity} color="#fff6e8" />
          <directionalLight
            position={[4, 7, 4]}
            intensity={2.4 * intensity}
            color="#fffaf2"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0002}
          />
          {/* Rim light */}
          <directionalLight position={[-4.5, 4, -5]} intensity={0.85 * intensity} color="#ffe9c9" />
          <directionalLight position={[-5, 3, 4]} intensity={0.5 * intensity} color="#f5efeb" />
          <hemisphereLight args={['#ffedcd', '#EDE8E1', 0.28 * intensity]} />
          <spotLight
            position={[6, 8, 4]}
            angle={0.38}
            penumbra={0.9}
            intensity={1.15 * intensity}
            color="#ffe9c9"
            castShadow={false}
          />
        </>
      ) : (
        <SunRig mode={lightMode} />
      )}

      {/* Studio HDRI — realistic reflections without background */}
      <Environment
        preset="studio"
        background={false}
        environmentIntensity={intensity * 1.1}
        environmentRotation={[0, 0.4, 0]}
      />
      {/* Fallback subtle sunset warmth layered */}
      <Environment preset="sunset" background={false} environmentIntensity={intensity * 0.35} />

      {/* Ultra-soft contact shadows: no shadow acne, physically-based blur */}
      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.42}
        scale={16}
        blur={3.2}
        far={5}
        smooth
        color="#6b5a44"
      />
    </>
  )
}
