import { useState, useMemo } from 'react'
import { Filter, Grid, Circle } from 'lucide-react'
import { galleryData, categories, GalleryItem } from '../data/galleryData'
import SpatialGalleryCard from './SpatialGalleryCard'
import Curved3DGallery from './three/Curved3DGallery'
import SpatialPlinthModal from './three/SpatialPlinthModal'

type ViewMode = '3d' | 'grid'

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('3d')
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return galleryData
    return galleryData.filter(item => item.category === selectedCategory)
  }, [selectedCategory])

  const handleInspect = (item: GalleryItem) => {
    setSelectedItem(item)
  }

  const handleCloseModal = () => {
    setSelectedItem(null)
  }

  return (
    <section id="gallery" className="py-20 px-4" style={{ backgroundColor: '#E2DCD5' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1F1D1A' }}>
            Our Gallery
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: '#54504A' }}>
            Explore our craftsmanship through our curated collection of furniture pieces and installations.
            Each piece tells a story of quality and attention to detail.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  backgroundColor: selectedCategory === category.id ? '#B38E5B' : '#EDE8E1',
                  color: selectedCategory === category.id ? '#FFFFFF' : '#1F1D1A',
                  boxShadow: selectedCategory === category.id ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('3d')}
              className="p-3 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: viewMode === '3d' ? '#B38E5B' : '#EDE8E1',
                color: viewMode === '3d' ? '#FFFFFF' : '#1F1D1A',
                boxShadow: viewMode === '3d' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              title="3D View"
            >
              <Circle size={20} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="p-3 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: viewMode === 'grid' ? '#B38E5B' : '#EDE8E1',
                color: viewMode === 'grid' ? '#FFFFFF' : '#1F1D1A',
                boxShadow: viewMode === 'grid' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              title="Grid View"
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-sm" style={{ color: '#54504A' }}>
            Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
          </p>
        </div>

        {/* Gallery Content */}
        {viewMode === '3d' ? (
          <Curved3DGallery items={filteredItems} onItemClick={handleInspect} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <SpatialGalleryCard key={item.id} item={item} onInspect={handleInspect} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <Filter size={48} className="mx-auto mb-4" style={{ color: 'rgba(84, 80, 74, 0.5)' }} />
            <p className="text-lg" style={{ color: '#54504A' }}>No items found in this category.</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-4 px-6 py-2 text-white rounded-full transition-colors"
              style={{ backgroundColor: '#B38E5B' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9E7B56'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B38E5B'}
            >
              View All Items
            </button>
          </div>
        )}

        {/* Business Info */}
        <div className="mt-16 grid md:grid-cols-2 gap-8 rounded-2xl p-8" style={{ backgroundColor: '#EDE8E1' }}>
          <div>
            <h3 className="font-display text-2xl font-bold mb-4" style={{ color: '#1F1D1A' }}>
              Visit Our Showroom
            </h3>
            <div className="space-y-3" style={{ color: '#54504A' }}>
              <p>
                <strong style={{ color: '#1F1D1A' }}>Hyderabad:</strong><br />
                Plot No 84/P, Opp Lakshyam School, Subhash Nagar,<br />
                Jeedimetla, Hyderabad, Telangana 500055
              </p>
              <p>
                <strong style={{ color: '#1F1D1A' }}>Andhra Pradesh:</strong><br />
                Pentapadu, Near Tadepalligudem, AP 534166
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold mb-4" style={{ color: '#1F1D1A' }}>
              Contact Us
            </h3>
            <div className="space-y-3" style={{ color: '#54504A' }}>
              <p>
                <strong style={{ color: '#1F1D1A' }}>Phone:</strong><br />
                +91 9603077444 / +91 9603177444 / +91 9849300667
              </p>
              <p>
                <strong style={{ color: '#1F1D1A' }}>Email:</strong><br />
                info@mokshaaenterprises.com / srinug41@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <SpatialPlinthModal item={selectedItem} onClose={handleCloseModal} />
      )}
    </section>
  )
}