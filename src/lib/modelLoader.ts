/**
 * Model & Texture Optimization — DRACO + KTX2 + Meshopt
 * 
 *  1. Compress geometry: gltf-transform draco input.glb output-draco.glb --encode-speed 0
 *  2. Compress textures: gltf-transform etc1s input.glb output-ktx2.glb --quality 128
 *  Result: ~60-80% smaller GLB, GPU-native decode.
 */

import { useGLTF } from '@react-three/drei'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import * as THREE from 'three'

let configured = false

export function configureModelLoaders(renderer?: THREE.WebGLRenderer) {
  if (configured) return
  configured = true

  const draco = new DRACOLoader()
  draco.setDecoderPath('/draco/')
  draco.setDecoderConfig({ type: 'wasm' } as any)
  draco.preload()

  const ktx2 = new KTX2Loader()
  ktx2.setTranscoderPath('/basis/')
  if (renderer) ktx2.detectSupport(renderer)

  // drei 9.x: useGLTF may not expose setDecoder; guard safely
  try {
    ;(useGLTF as any).setDecoder?.('draco', draco as any)
  } catch {}
  ;(useGLTF as any).ktx2Loader = ktx2
  ;(useGLTF as any).meshoptDecoder = MeshoptDecoder

  if ((import.meta as any).env?.DEV) {
    console.info('[modelLoader] DRACO + KTX2 + Meshopt configured.')
  }
  void THREE
}

export function preloadModel(url: string) {
  useGLTF.preload(url)
}

export function disposeModelLoaders() {
  configured = false
}
