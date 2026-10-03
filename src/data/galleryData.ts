export interface GalleryItem {
  id: string
  title: string
  category: 'sofas' | 'cots' | 'dining' | 'mattresses' | 'installations'
  dimensions?: string
  description: string
  imagePath: string
  tags: string[]
  materials?: string[]
  price?: string
}

export const galleryData: GalleryItem[] = [
  // Sofas
  {
    id: 'sofa-1',
    title: 'Premium L-Shape Sofa',
    category: 'sofas',
    dimensions: '280cm x 180cm x 85cm',
    description: 'Luxurious L-shaped sofa with premium fabric upholstery and solid teak wood frame.',
    imagePath: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
    tags: ['Luxury', 'BestSeller', 'Custom'],
    materials: ['Solid Teak Wood', 'High-Density Foam', 'Premium Fabric'],
    price: '₹45,000'
  },
  {
    id: 'sofa-2',
    title: 'Contemporary Recliner',
    category: 'sofas',
    dimensions: '120cm x 90cm x 100cm',
    description: 'Modern recliner sofa with adjustable backrest and premium leather finish.',
    imagePath: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=600&fit=crop',
    tags: ['Modern', 'Comfort'],
    materials: ['Hardwood Frame', 'Genuine Leather', 'Steel Mechanism'],
    price: '₹28,000'
  },
  {
    id: 'sofa-3',
    title: 'Three-Seater Fabric Sofa',
    category: 'sofas',
    dimensions: '200cm x 90cm x 85cm',
    description: 'Elegant three-seater sofa with soft fabric upholstery and wooden legs.',
    imagePath: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop',
    tags: ['Classic', 'Comfort'],
    materials: ['Sheesham Wood', 'Cotton Fabric', 'Foam Cushions'],
    price: '₹22,000'
  },
  {
    id: 'sofa-4',
    title: 'Chesterfield Leather Sofa',
    category: 'sofas',
    dimensions: '220cm x 95cm x 90cm',
    description: 'Timeless Chesterfield design with button tufting and premium leather.',
    imagePath: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?w=800&h=600&fit=crop',
    tags: ['Luxury', 'Classic', 'BestSeller'],
    materials: ['Mahogany Wood', 'Top-Grain Leather', 'Dunlop Foam'],
    price: '₹55,000'
  },
  
  // Cots
  {
    id: 'cot-1',
    title: 'King Size Wooden Cot',
    category: 'cots',
    dimensions: '200cm x 180cm x 100cm',
    description: 'Elegant king-size bed with carved headboard and solid wood construction.',
    imagePath: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop',
    tags: ['Luxury', 'Handcrafted'],
    materials: ['Solid Teak Wood', 'Natural Finish', 'Plywood Base'],
    price: '₹35,000'
  },
  {
    id: 'cot-2',
    title: 'Storage Bed with Hydraulic Lift',
    category: 'cots',
    dimensions: '200cm x 150cm x 95cm',
    description: 'Smart storage bed with hydraulic mechanism and ample under-bed space.',
    imagePath: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=600&fit=crop',
    tags: ['Functional', 'Modern'],
    materials: ['Engineered Wood', 'Hydraulic Pistons', 'Laminate Finish'],
    price: '₹28,000'
  },
  {
    id: 'cot-3',
    title: 'Queen Size Platform Bed',
    category: 'cots',
    dimensions: '200cm x 150cm x 40cm',
    description: 'Minimalist platform bed with low profile and contemporary design.',
    imagePath: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop',
    tags: ['Modern', 'Minimal'],
    materials: ['Solid Wood', 'Walnut Finish', 'Slat Base'],
    price: '₹24,000'
  },
  {
    id: 'cot-4',
    title: 'Kids Bunk Bed',
    category: 'cots',
    dimensions: '200cm x 100cm x 160cm',
    description: 'Safe and sturdy bunk bed for kids with guard rails and ladder.',
    imagePath: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=600&fit=crop',
    tags: ['Kids', 'Safe'],
    materials: ['Pine Wood', 'Non-Toxic Paint', 'Metal Hardware'],
    price: '₹18,000'
  },

  // Dining
  {
    id: 'dining-1',
    title: '6-Seater Solid Wood Dining Set',
    category: 'dining',
    dimensions: '180cm x 90cm x 75cm',
    description: 'Classic 6-seater dining table with matching chairs and elegant design.',
    imagePath: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop',
    tags: ['Classic', 'Family', 'BestSeller'],
    materials: ['Sheesham Wood', 'Fabric Seats', 'Varnish Finish'],
    price: '₹32,000'
  },
  {
    id: 'dining-2',
    title: 'Glass Top Dining Table',
    category: 'dining',
    dimensions: '160cm x 90cm x 75cm',
    description: 'Modern glass-top dining table with chrome legs and sleek design.',
    imagePath: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=800&h=600&fit=crop',
    tags: ['Modern', 'Glass'],
    materials: ['Tempered Glass', 'Stainless Steel', 'Leather Chairs'],
    price: '₹28,000'
  },
  {
    id: 'dining-3',
    title: 'Marble Top Dining Set',
    category: 'dining',
    dimensions: '200cm x 100cm x 75cm',
    description: 'Luxurious marble-top dining table with ornate wooden base.',
    imagePath: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=600&fit=crop',
    tags: ['Luxury', 'Elegant'],
    materials: ['Italian Marble', 'Teak Wood Base', 'Velvet Chairs'],
    price: '₹45,000'
  },
  {
    id: 'dining-4',
    title: 'Round Dining Table',
    category: 'dining',
    dimensions: '120cm diameter x 75cm height',
    description: 'Compact round dining table perfect for small spaces and intimate meals.',
    imagePath: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&h=600&fit=crop',
    tags: ['Compact', 'Modern'],
    materials: ['Solid Wood', 'Matte Finish', 'Upholstered Chairs'],
    price: '₹22,000'
  },

  // Mattresses
  {
    id: 'mattress-1',
    title: 'Orthopedic Memory Foam Mattress',
    category: 'mattresses',
    dimensions: '200cm x 180cm x 25cm',
    description: 'Premium orthopedic mattress with memory foam and pressure relief.',
    imagePath: 'https://images.unsplash.com/photo-1632797104408-b5dfc56906f8?w=800&h=600&fit=crop',
    tags: ['Health', 'Premium', 'BestSeller'],
    materials: ['Memory Foam', 'High-Density Foam', 'Anti-Fabric Cover'],
    price: '₹18,000'
  },
  {
    id: 'mattress-2',
    title: 'Spring Mattress with Pillow Top',
    category: 'mattresses',
    dimensions: '200cm x 150cm x 30cm',
    description: 'Luxurious spring mattress with plush pillow top for added comfort.',
    imagePath: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&h=600&fit=crop',
    tags: ['Luxury', 'Comfort'],
    materials: ['Pocket Springs', 'Pillow Top', 'Breathable Fabric'],
    price: '₹22,000'
  },
  {
    id: 'mattress-3',
    title: 'Latex Hybrid Mattress',
    category: 'mattresses',
    dimensions: '200cm x 180cm x 28cm',
    description: 'Natural latex hybrid mattress combining support and comfort.',
    imagePath: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800&h=600&fit=crop',
    tags: ['Natural', 'Eco-Friendly'],
    materials: ['Natural Latex', 'Coir Layer', 'Organic Cotton'],
    price: '₹25,000'
  },
  {
    id: 'mattress-4',
    title: 'Dual Comfort Mattress',
    category: 'mattresses',
    dimensions: '200cm x 150cm x 22cm',
    description: 'Reversible mattress with soft and firm sides for customizable comfort.',
    imagePath: 'https://images.unsplash.com/photo-1590487988256-9ed24133863e?w=800&h=600&fit=crop',
    tags: ['Versatile', 'Value'],
    materials: ['PU Foam', 'Bonded Foam', 'Knitted Fabric'],
    price: '₹12,000'
  },

  // Installations
  {
    id: 'install-1',
    title: 'Luxury Living Room Setup',
    category: 'installations',
    dimensions: 'Full Room',
    description: 'Complete living room installation with L-shape sofa, center table, and entertainment unit.',
    imagePath: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    tags: ['Installation', 'Luxury', 'Custom'],
    materials: ['Custom Furniture', 'Wall Paneling', 'Lighting'],
  },
  {
    id: 'install-2',
    title: 'Master Bedroom Suite',
    category: 'installations',
    dimensions: 'Full Room',
    description: 'Elegant master bedroom with king-size bed, wardrobes, and bedside tables.',
    imagePath: 'https://images.unsplash.com/photo-1616594039964-40891a9095b9?w=800&h=600&fit=crop',
    tags: ['Installation', 'Elegant'],
    materials: ['Custom Furniture', 'Walk-in Wardrobe', 'Soft Furnishings'],
  },
  {
    id: 'install-3',
    title: 'Modern Dining Room',
    category: 'installations',
    dimensions: 'Full Room',
    description: 'Contemporary dining room with 8-seater table and display cabinets.',
    imagePath: 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=800&h=600&fit=crop',
    tags: ['Installation', 'Modern'],
    materials: ['Custom Furniture', 'Crockery Unit', 'Chandelier'],
  },
  {
    id: 'install-4',
    title: 'Showroom Display',
    category: 'installations',
    dimensions: 'Full Space',
    description: 'Professional showroom setup displaying complete furniture collection.',
    imagePath: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=600&fit=crop',
    tags: ['Installation', 'Showroom'],
    materials: ['Display Units', 'Lighting', 'Flooring'],
  },
]

export const categories = [
  { id: 'all', label: 'All' },
  { id: 'sofas', label: 'Sofas' },
  { id: 'cots', label: 'Beds & Cots' },
  { id: 'dining', label: 'Dining' },
  { id: 'mattresses', label: 'Mattresses' },
  { id: 'installations', label: 'Installations' },
] as const

export const whatsappNumber = '919603077444'
export const whatsappMessage = (productTitle: string) => 
  `Hi Mokshaa Enterprises, I am interested in this gallery design: ${productTitle}`

export const getWhatsAppUrl = (productTitle: string) => {
  const message = encodeURIComponent(whatsappMessage(productTitle))
  return `https://wa.me/${whatsappNumber}?text=${message}`
}