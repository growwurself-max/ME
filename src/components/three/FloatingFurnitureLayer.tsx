import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import FloatingFurniture from './FloatingFurniture'

interface FloatingItem {
  type: 'chair' | 'table' | 'lamp' | 'pouf' | 'stool'
  position: [number, number, number]
  scale: number
  rotationSpeed: number
  floatSpeed: number
  floatAmplitude: number
}

// Desktop items - full set for larger screens
const desktopItems: FloatingItem[] = [
  // Hero section items
  { type: 'chair', position: [-3, 1, -2], scale: 0.8, rotationSpeed: 0.2, floatSpeed: 0.8, floatAmplitude: 0.1 },
  { type: 'lamp', position: [3, 1.5, -1.5], scale: 0.7, rotationSpeed: 0.3, floatSpeed: 1.2, floatAmplitude: 0.12 },
  { type: 'pouf', position: [-2.5, 0.5, -3], scale: 0.6, rotationSpeed: 0.15, floatSpeed: 0.9, floatAmplitude: 0.08 },
  
  // Collection section items
  { type: 'table', position: [2.5, 0.8, -2], scale: 0.9, rotationSpeed: 0.25, floatSpeed: 1, floatAmplitude: 0.1 },
  { type: 'stool', position: [-3, 0.6, -1.8], scale: 0.7, rotationSpeed: 0.2, floatSpeed: 0.7, floatAmplitude: 0.09 },
  
  // Craftsmanship section items
  { type: 'chair', position: [3, 0.9, -2.5], scale: 0.75, rotationSpeed: 0.22, floatSpeed: 0.85, floatAmplitude: 0.11 },
  { type: 'lamp', position: [-2.8, 1.2, -2], scale: 0.65, rotationSpeed: 0.28, floatSpeed: 1.1, floatAmplitude: 0.13 },
  
  // Gallery section items
  { type: 'pouf', position: [2.8, 0.5, -2.2], scale: 0.55, rotationSpeed: 0.18, floatSpeed: 0.95, floatAmplitude: 0.07 },
  { type: 'table', position: [-2.5, 0.7, -2.8], scale: 0.85, rotationSpeed: 0.24, floatSpeed: 1.05, floatAmplitude: 0.1 },
  { type: 'stool', position: [0, 0.6, -3], scale: 0.6, rotationSpeed: 0.2, floatSpeed: 0.8, floatAmplitude: 0.08 },
]

// Mobile items - reduced set for better performance
const mobileItems: FloatingItem[] = [
  { type: 'chair', position: [-2, 0.8, -2], scale: 0.6, rotationSpeed: 0.2, floatSpeed: 0.8, floatAmplitude: 0.08 },
  { type: 'lamp', position: [2, 1.2, -1.5], scale: 0.5, rotationSpeed: 0.25, floatSpeed: 1, floatAmplitude: 0.1 },
  { type: 'pouf', position: [-1.5, 0.4, -2.5], scale: 0.45, rotationSpeed: 0.15, floatSpeed: 0.7, floatAmplitude: 0.06 },
  { type: 'table', position: [1.8, 0.6, -2], scale: 0.65, rotationSpeed: 0.2, floatSpeed: 0.9, floatAmplitude: 0.08 },
]

function Scene({ scrollProgress, items }: { scrollProgress: number; items: FloatingItem[] }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      
      {items.map((item, index) => (
        <FloatingFurniture
          key={index}
          type={item.type}
          position={item.position}
          scale={item.scale}
          rotationSpeed={item.rotationSpeed}
          floatSpeed={item.floatSpeed}
          floatAmplitude={item.floatAmplitude}
          scrollParallax={true}
          scrollProgress={scrollProgress}
        />
      ))}
    </>
  )
}

export default function FloatingFurnitureLayer() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(scrollTop / docHeight, 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const items = useMemo(() => isMobile ? mobileItems : desktopItems, [isMobile])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'multiply' }}
    >
      <Canvas
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ 
          antialias: !isMobile, 
          alpha: true, 
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        performance={{ min: 0.5 }}
      >
        <Scene scrollProgress={scrollProgress} items={items} />
      </Canvas>
    </div>
  )
}
