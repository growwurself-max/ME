import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Float, Text, Html } from '@react-three/drei'
import { X, MessageCircle, Tag } from 'lucide-react'
import { GalleryItem, getWhatsAppUrl } from '../../data/galleryData'
import * as THREE from 'three'

interface SpatialPlinthModalProps {
  item: GalleryItem | null
  onClose: () => void
}

function PlinthScene({ item }: { item: GalleryItem }) {
  return (
    <>
      {/* Environment Lighting */}
      <Environment preset="studio" />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Floor Reflections */}
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.6}
        scale={10}
        blur={2.5}
        far={4}
        resolution={256}
        color="#000000"
      />

      {/* Virtual Pedestal */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.3, 32]} />
        <meshStandardMaterial 
          color="#EAE6DF" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Product Display */}
      <Float
        rotationIntensity={0.2}
        floatIntensity={0.5}
        floatingRange={[-0.1, 0.1]}
        speed={2}
      >
        <group position={[0, 0.5, 0]}>
          {/* Image as Texture on Plane */}
          <mesh castShadow>
            <planeGeometry args={[2, 1.5]} />
            <meshStandardMaterial 
              color="#ffffff"
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
          
          {/* 3D Border/Frame */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[2.1, 1.6, 0.1]} />
            <meshStandardMaterial 
              color="#9E7B56"
              roughness={0.3}
              metalness={0.6}
            />
          </mesh>
        </group>
      </Float>

      {/* Info Text */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.15}
        color="#22201E"
        anchorX="center"
        anchorY="middle"
      >
        {item.title}
      </Text>

      {/* Orbit Controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={6}
        autoRotate={false}
      />
    </>
  )
}

export default function SpatialPlinthModal({ item, onClose }: SpatialPlinthModalProps) {
  const [imageError, setImageError] = useState(false)

  if (!item) return null

  const handleWhatsAppClick = () => {
    const url = getWhatsAppUrl(item.title)
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl bg-greige-light rounded-3xl overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-espresso transition-colors shadow-lg"
        >
          <X size={24} />
        </button>

        <div className="grid lg:grid-cols-2 h-[80vh] lg:h-[70vh]">
          {/* 3D Scene */}
          <div className="relative h-[40vh] lg:h-full bg-gradient-to-br from-greige-base to-greige-warm">
            <Canvas
              camera={{ position: [0, 0, 4], fov: 50 }}
              frameloop="demand"
              gl={{ antialias: true, alpha: true }}
            >
              <Suspense fallback={null}>
                <PlinthScene item={item} />
              </Suspense>
            </Canvas>

            {/* Product Image Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                src={item.imagePath}
                alt={item.title}
                className="max-h-[60%] max-w-[80%] object-contain rounded-lg shadow-2xl"
                onError={() => setImageError(true)}
              />
              {imageError && (
                <div className="text-center p-8 bg-white/90 rounded-lg">
                  <p className="text-espresso font-medium">Image not available</p>
                  <p className="text-sm text-warm-slate mt-2">{item.title}</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="p-8 overflow-y-auto bg-greige-light">
            <div className="mb-6">
              <h2 className="font-display text-3xl font-bold text-espresso mb-2">
                {item.title}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-brass-light/20 text-wood-warm rounded-full"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {item.price && (
              <div className="mb-6">
                <p className="text-2xl font-bold text-brass-light">{item.price}</p>
              </div>
            )}

            {item.dimensions && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-espresso mb-2">Dimensions</h3>
                <p className="text-warm-slate">{item.dimensions}</p>
              </div>
            )}

            {item.materials && item.materials.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-espresso mb-2">Materials</h3>
                <div className="flex flex-wrap gap-2">
                  {item.materials.map((material) => (
                    <span
                      key={material}
                      className="px-3 py-1 text-sm bg-greige-base text-warm-slate rounded-lg"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-espresso mb-2">Description</h3>
              <p className="text-warm-slate leading-relaxed">{item.description}</p>
            </div>

            {/* WhatsApp CTA */}
            <button
              onClick={handleWhatsAppClick}
              className="w-full flex items-center justify-center gap-3 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <MessageCircle size={20} />
              Order Custom Dimensions via WhatsApp
            </button>

            {/* Contact Info */}
            <div className="mt-6 pt-6 border-t border-greige-base">
              <p className="text-sm text-warm-slate text-center">
                For immediate assistance, call:{' '}
                <a href="tel:+919603077444" className="text-brass-light font-medium hover:underline">
                  +91 9603077444
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}