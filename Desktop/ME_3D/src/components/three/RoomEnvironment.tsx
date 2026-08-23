import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

export type LightMode = 0 | 0.5 | 1 // 0 morning · 0.5 afternoon · 1 evening

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
  const amb = useRef<THREE.AmbientLight>(null)

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
      dir.current.position.lerp(pos, Math.min(1, delta * 4))
      dir.current.color.lerp(color, Math.min(1, delta * 4))
      dir.current.intensity = THREE.MathUtils.damp(dir.current.intensity, inten * 2.2, 4, delta)
    }
    if (amb.current) {
      amb.current.intensity = THREE.MathUtils.damp(amb.current.intensity, ambI, 4, delta)
    }
  })

  return (
    <>
      <ambientLight ref={amb} intensity={0.55} />
      <directionalLight
        ref={dir}
        position={[3, 8, 3]}
        intensity={3.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} color="#f5efeb" />
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
          <ambientLight intensity={0.6 * intensity} />
          <directionalLight position={[4, 7, 4]} intensity={2.4} color="#fffaf2" />
          <directionalLight position={[-5, 3, -4]} intensity={0.6} color="#f5efeb" />
          <spotLight
            position={[6, 8, 4]}
            angle={0.4}
            penumbra={1}
            intensity={1.2 * intensity}
            color="#ffe9c9"
          />
        </>
      ) : (
        <SunRig mode={lightMode} />
      )}
      <Environment preset="sunset" background={false} environmentIntensity={intensity} />
      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.35}
        scale={14}
        blur={2.8}
        far={4}
        color="#8a6d4f"
      />
    </>
  )
}
