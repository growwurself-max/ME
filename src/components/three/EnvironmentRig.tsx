import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import type { PerformanceConfig } from '../../lib/usePerformanceTier'

/**
 * EnvironmentRig — modular HDRI + soft lighting
 * - HDRI via drei <Environment> (preset OR custom file via `hdriPath`)
 *   Drop a .hdr in /public/hdri/ and pass `hdriPath="/hdri/studio.hdr"`
 * - Warm key + Cool rim for premium separation
 * - ContactShadows (cheap, no shadow map) + optional directional shadow
 */

export interface EnvironmentRigProps {
  perf: PerformanceConfig
  intensity?: number
  /** Optional custom HDRI. e.g. "/hdri/potsdamer_platz_1k.hdr" */
  hdriPath?: string
  lightMode?: number // 0 morning · 0.5 afternoon · 1 evening (from Hero)
  enableRim?: boolean
}

const MORNING = {
  color: new THREE.Color('#ffd9a0'),
  sunPos: new THREE.Vector3(-6, 4.5, 5),
  intensity: 1.35,
  ambient: 0.45,
  rim: new THREE.Color('#ffe9c9'),
}
const AFTERNOON = {
  color: new THREE.Color('#ffffff'),
  sunPos: new THREE.Vector3(3, 8, 3),
  intensity: 1.7,
  ambient: 0.65,
  rim: new THREE.Color('#dbeafe'), // cool blue rim for contrast
}
const EVENING = {
  color: new THREE.Color('#ffb26b'),
  sunPos: new THREE.Vector3(7, 2.5, -4),
  intensity: 1.05,
  ambient: 0.32,
  rim: new THREE.Color('#ffcf8a'),
}

function lerpVec(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return a.clone().lerp(b, t)
}

function SunRig({ mode, perf }: { mode: number; perf: PerformanceConfig }) {
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
    const rimCol = a.rim.clone().lerp(b.rim, local)
    const pos = lerpVec(a.sunPos, b.sunPos, local)
    const inten = THREE.MathUtils.lerp(a.intensity, b.intensity, local)
    const ambI = THREE.MathUtils.lerp(a.ambient, b.ambient, local)

    if (dir.current) {
      dir.current.position.lerp(pos, Math.min(1, delta * 3))
      dir.current.color.lerp(color, Math.min(1, delta * 3))
      dir.current.intensity = THREE.MathUtils.damp(dir.current.intensity, inten * 2.2, 4, delta)
    }
    if (amb.current) amb.current.intensity = THREE.MathUtils.damp(amb.current.intensity, ambI, 4, delta)
    if (rim.current) {
      rim.current.position.lerp(pos.clone().multiplyScalar(-1).add(new THREE.Vector3(0, 1.8, 0)), Math.min(1, delta * 3))
      rim.current.color.lerp(rimCol, Math.min(1, delta * 3))
      rim.current.intensity = THREE.MathUtils.damp(rim.current.intensity, 0.9, 4, delta)
    }
    if (fill.current) fill.current.intensity = THREE.MathUtils.damp(fill.current.intensity, 0.45, 3, delta)
  })

  return (
    <>
      <ambientLight ref={amb} intensity={0.55} color="#fff6e8" />
      <directionalLight
        ref={dir}
        position={[3, 8, 3]}
        intensity={perf.enableShadows ? 3.2 : 2.2}
        color="#ffffff"
        castShadow={perf.enableShadows}
        shadow-mapSize={[perf.shadowMapSize, perf.shadowMapSize]}
        shadow-bias={-0.00018}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* Cool/Warm Rim — accent back-light */}
      <directionalLight ref={rim} position={[-4, 3, -6]} intensity={0.9} color="#ffe9c9" />
      <directionalLight ref={fill} position={[-5, 3, 4]} intensity={0.5} color="#f5efeb" />
      <hemisphereLight args={['#ffedcd', '#0f1015', 0.35]} />
    </>
  )
}

export default function EnvironmentRig({
  perf,
  intensity,
  hdriPath,
  lightMode,
  enableRim = true,
}: EnvironmentRigProps) {
  const envIntensity = (intensity ?? 1) * perf.envIntensity

  return (
    <>
      {/* ——— Lights ——— */}
      {lightMode === undefined ? (
        <>
          <ambientLight intensity={0.55 * envIntensity} color="#fff6e8" />
          <directionalLight
            position={[4, 7, 4]}
            intensity={2.45 * envIntensity}
            color="#fffaf2"
            castShadow={perf.enableShadows}
            shadow-mapSize={[perf.shadowMapSize, perf.shadowMapSize]}
            shadow-bias={-0.00018}
          />
          {enableRim && (
            // Warm/Cool rim: cool-blue on high tier, warm on medium — instant luxury
            <directionalLight position={[-4.8, 4.2, -5.5]} intensity={0.95 * envIntensity} color={perf.tier === 'high' ? '#cfe1ff' : '#ffe9c9'} />
          )}
          <directionalLight position={[-5, 3, 4]} intensity={0.52 * envIntensity} color="#f5efeb" />
          <hemisphereLight args={['#ffedcd', '#0f1015', 0.28 * envIntensity]} />
          {!perf.enableShadows && (
            <spotLight position={[6, 8, 4]} angle={0.38} penumbra={0.9} intensity={1.0 * envIntensity} color="#ffe9c9" />
          )}
          {perf.enableShadows && (
            <spotLight position={[6, 8, 4]} angle={0.38} penumbra={0.95} intensity={0.9 * envIntensity} color="#ffe9c9" castShadow={false} />
          )}
        </>
      ) : (
        <SunRig mode={lightMode} perf={perf} />
      )}

      {/* ——— HDRI Environment ———
          Usage:
            <EnvironmentRig hdriPath="/hdri/studio_1k.hdr" />
          Falls back to preset if not provided. Put .hdr/.exr in /public.
          Recommended free HDRI: https://polyhaven.com/a/studio_small_03 (1k)
      */}
      {hdriPath ? (
        <Environment files={hdriPath} background={false} environmentIntensity={envIntensity * 1.05} />
      ) : (
        <>
          {/* Layered presets: studio = sharp reflections, sunset = warmth */}
          <Environment preset="studio" background={false} environmentIntensity={envIntensity * 0.95} environmentRotation={[0, 0.42, 0]} />
          <Environment preset="sunset" background={false} environmentIntensity={envIntensity * 0.32} />
        </>
      )}

      {/* ——— Contact Shadows — subtle AO beneath model ——— */}
      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={perf.tier === 'low' ? 0.22 : 0.40}
        scale={perf.tier === 'high' ? 16 : 13}
        blur={perf.tier === 'high' ? 3.2 : perf.tier === 'medium' ? 2.6 : 2.0}
        far={perf.tier === 'high' ? 5.5 : 4}
        smooth
        color="#6b5a44"
        resolution={perf.tier === 'high' ? 512 : 256}
      />
    </>
  )
}
