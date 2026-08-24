import { useRef, useState, useEffect } from 'react'
import { GalleryItem } from '../data/galleryData'
import { ExternalLink, ShoppingCart } from 'lucide-react'

interface SpatialGalleryCardProps {
  item: GalleryItem
  onInspect: (item: GalleryItem) => void
}

export default function SpatialGalleryCard({ item, onInspect }: SpatialGalleryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')
  const [sheenPosition, setSheenPosition] = useState({ x: '-100%', y: '-100%' })
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      const rotateX = (y - centerY) / 10
      const rotateY = (centerX - x) / 10
      
      setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`)
      
      // Update sheen position
      const sheenX = ((x / rect.width) * 100).toFixed(0)
      const sheenY = ((y / rect.height) * 100).toFixed(0)
      setSheenPosition({ x: `${sheenX}%`, y: `${sheenY}%` })
    }

    const handleMouseLeave = () => {
      setTransform('perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)')
      setSheenPosition({ x: '-100%', y: '-100%' })
      setIsHovered(false)
    }

    const handleMouseEnter = () => {
      setIsHovered(true)
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)
    card.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
      card.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className="group relative cursor-pointer"
      style={{
        transform,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        transformStyle: 'preserve-3d',
      }}
      onClick={() => onInspect(item)}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-studio-lg transition-all duration-500" style={{ backgroundColor: '#EDE8E1' }}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={item.imagePath}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            crossOrigin="anonymous"
          />
          
          {/* Dynamic Sheen Effect */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${sheenPosition.x} ${sheenPosition.y}, rgba(255,255,255,0.3) 0%, transparent 50%)`,
              opacity: isHovered ? 1 : 0,
            }}
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Quick Info on Hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <div className="flex flex-wrap gap-2">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs font-medium bg-brass-light/90 text-white rounded-full backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 relative" style={{ transform: 'translateZ(20px)' }}>
          <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-brass-light transition-colors" style={{ color: '#1F1D1A' }}>
            {item.title}
          </h3>
          
          <p className="text-sm line-clamp-2 mb-3" style={{ color: '#54504A' }}>
            {item.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.price && (
                <span className="font-semibold" style={{ color: '#B88E52' }}>{item.price}</span>
              )}
              {item.dimensions && (
                <span className="text-xs" style={{ color: '#54504A' }}>• {item.dimensions}</span>
              )}
            </div>
            
            <button className="p-2 rounded-full transition-all duration-300" style={{ backgroundColor: '#E2DCD5', color: '#1F1D1A' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B38E5B'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E2DCD5'; e.currentTarget.style.color = '#1F1D1A'; }}>
              <ExternalLink size={18} />
            </button>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 rounded-2xl shadow-[0_0_40px_-10px_rgba(158,123,86,0.3)]" />
        </div>
      </div>
    </div>
  )
}