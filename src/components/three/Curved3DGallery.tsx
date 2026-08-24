import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei'
import { GalleryItem } from '../../data/galleryData'
import * as THREE from 'three'
import gsap from 'gsap'

interface Curved3DGalleryProps {
  items: GalleryItem[]
  onItemClick: (item: GalleryItem) => void
}

function GalleryItem3D({ 
  item, 
  index, 
  total, 
  radius, 
  onClick 
}: { 
  item: GalleryItem
  index: number
  total: number
  radius: number
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()

  // Calculate position on curve
  const angle = (index / total) * Math.PI * 2
  const x = Math.sin(angle) * radius
  const z = Math.cos(angle) * radius - radius
  const rotationY = -angle

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + index) * 0.1
    }
  })

  // Handle hover animation separately
  useEffect(() => {
    if (meshRef.current) {
      if (hovered) {
        gsap.to(meshRef.current.position, {
          x: x * 1.1,
          z: (z + radius) * 1.1 - radius,
          duration: 0.3,
        })
        gsap.to(meshRef.current.rotation, {
          y: rotationY + 0.1,
          duration: 0.3,
        })
      } else {
        gsap.to(meshRef.current.position, {
          x,
          z,
          duration: 0.3,
        })
        gsap.to(meshRef.current.rotation, {
          y: rotationY,
          duration: 0.3,
        })
      }
    }
  }, [hovered, x, z, radius, rotationY])

  return (
    <group position={[x, 0, z]}>
      <mesh
        ref={meshRef}
        rotation={[0, rotationY, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[2, 1.5]} />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      
      {/* Image overlay */}
      <Html position={[0, 0, 0.01]} transform>
        <div 
          className="w-[200px] h-[150px] rounded-lg overflow-hidden cursor-pointer shadow-xl"
          style={{ 
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.3s ease'
          }}
        >
          <img
            src={item.imagePath}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </Html>

      {/* Title label */}
      {hovered && (
        <Html position={[0, -1, 0]} center>
          <div className="bg-espresso/90 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
            {item.title}
          </div>
        </Html>
      )}
    </group>
  )
}

function GalleryScene({ items, onItemClick }: { items: GalleryItem[]; onItemClick: (item: GalleryItem) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const [rotation, setRotation] = useState(0)
  const radius = 4

  // Handle scroll/wheel for rotation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      setRotation(prev => prev + e.deltaY * 0.001)
    }

    window.addEventListener('wheel', handleWheel)
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState(0)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart(e.touches[0].clientX)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touchEnd = e.touches[0].clientX
      const diff = touchStart - touchEnd
      setRotation(prev => prev + diff * 0.005)
      setTouchStart(touchEnd)
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [touchStart])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation
    }
  })

  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.6} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} />

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.4}
        scale={15}
        blur={3}
        far={5}
        color="#000000"
      />

      <group ref={groupRef}>
        {items.map((item, index) => (
          <GalleryItem3D
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            radius={radius}
            onClick={() => onItemClick(item)}
          />
        ))}
      </group>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={10}
        autoRotate={false}
      />
    </>
  )
}

export default function Curved3DGallery({ items, onItemClick }: Curved3DGalleryProps) {
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, [])

  if (items.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center rounded-2xl" style={{ backgroundColor: '#E2DCD5' }}>
        <p style={{ color: '#54504A' }}>No items to display</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #E0DAD2, #D4CDC3)' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: isMobile ? 60 : 50 }}
        frameloop="demand"
        gl={{ antialias: true, alpha: true }}
      >
        <GalleryScene items={items} onItemClick={onItemClick} />
      </Canvas>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm pointer-events-none" style={{ backgroundColor: 'rgba(232, 227, 220, 0.8)', backdropFilter: 'blur(12px) saturate(1.2)', WebkitBackdropFilter: 'blur(12px) saturate(1.2)', border: '1px solid #D5CEC4', color: '#1F1D1A' }}>
        Scroll or drag to rotate • Click to inspect
      </div>
    </div>
  )
}