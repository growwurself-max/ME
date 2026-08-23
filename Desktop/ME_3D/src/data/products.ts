export type Finish = {
  name: string
  color: string
  roughness: number
  metalness?: number
}

export type Product = {
  id: string
  name: string
  category: CategoryId
  tagline: string
  description: string
  priceRange: string
  dimensions: { width: number; depth: number; height: number }
  finishes: Finish[]
  modelUrl?: string
  shape: 'sofa' | 'bed' | 'dining' | 'mattress' | 'table'
  warranty: string
}

export type CategoryId =
  | 'sofas'
  | 'cots'
  | 'dining'
  | 'mattresses'
  | 'accents'

export const CATEGORIES: { id: CategoryId; label: string; blurb: string }[] = [
  { id: 'sofas', label: 'Sofas', blurb: 'L-Shape, Recliner, Luxury Fabric & Chesterfield' },
  { id: 'cots', label: 'Cots & Beds', blurb: 'Premium Wooden, Hydraulic Storage & Kids Cots' },
  { id: 'dining', label: 'Dining', blurb: 'Solid Wood Sets & Marble-top Tables' },
  { id: 'mattresses', label: 'Mattresses', blurb: 'Orthopedic, Memory Foam & Pocket Spring' },
  { id: 'accents', label: 'Accent Furniture', blurb: 'Coffee Tables & Statement Pieces' },
]

export const FINISH_PRESETS: Record<string, Finish> = {
  velvetEmerald: { name: 'Velvet Emerald', color: '#0e5c47', roughness: 0.85 },
  royalBlue: { name: 'Royal Blue', color: '#1f3a93', roughness: 0.8 },
  leatherTan: { name: 'Leather Tan', color: '#a0622d', roughness: 0.55 },
  charcoalGrey: { name: 'Charcoal Grey', color: '#3a3a3e', roughness: 0.7 },
  walnutWood: { name: 'Walnut Wood', color: '#5b3a1e', roughness: 0.6 },
  ivoryLinen: { name: 'Ivory Linen', color: '#e8e2d4', roughness: 0.9 },
}

const F = FINISH_PRESETS

export const PRODUCTS: Product[] = [
  {
    id: 'aurora-l-shape',
    name: 'Aurora L-Shape Sofa',
    category: 'sofas',
    tagline: 'Sectional grandeur for the modern living room',
    description:
      'Hand-tufted sectional in premium hardwood frame with high-resilience foam and stain-resistant upholstery.',
    priceRange: '₹48,000 – ₹85,000',
    dimensions: { width: 260, depth: 180, height: 85 },
    finishes: [F.velvetEmerald, F.charcoalGrey, F.leatherTan],
    shape: 'sofa',
    warranty: '5 Years Frame Warranty',
  },
  {
    id: 'chesterfield-royale',
    name: 'Chesterfield Royale',
    category: 'sofas',
    tagline: 'A timeless British silhouette, reimagined',
    description:
      'Deep-buttoned Chesterfield with rolled arms, kiln-dried hardwood frame and full-grain leather options.',
    priceRange: '₹62,000 – ₹95,000',
    dimensions: { width: 220, depth: 95, height: 78 },
    finishes: [F.leatherTan, F.royalBlue, F.charcoalGrey],
    shape: 'sofa',
    warranty: '10 Year Warranty',
  },
  {
    id: 'serenity-hydraulic-bed',
    name: 'Serenity Hydraulic Bed',
    category: 'cots',
    tagline: 'Storage that disappears at a touch',
    description:
      'Queen-size hydraulic storage cot in solid teak with soft-close lift mechanism and slatted ventilation base.',
    priceRange: '₹42,000 – ₹70,000',
    dimensions: { width: 150, depth: 200, height: 100 },
    finishes: [F.walnutWood, F.charcoalGrey],
    shape: 'bed',
    warranty: '10 Year Warranty',
  },
  {
    id: 'heritage-kids-cot',
    name: 'Heritage Kids Cot',
    category: 'cots',
    tagline: 'Safe, sturdy and built to grow',
    description:
      'Rounded-corner metal-reinforced wooden cot with anti-bacterial finish — perfect for growing families.',
    priceRange: '₹14,000 – ₹24,000',
    dimensions: { width: 120, depth: 190, height: 90 },
    finishes: [F.ivoryLinen, F.walnutWood],
    shape: 'bed',
    warranty: '5 Year Warranty',
  },
  {
    id: 'monarch-dining-set',
    name: 'Monarch Dining Set',
    category: 'dining',
    tagline: 'Six seats, one statement',
    description:
      'Six-seater solid sheesham dining set with Italian marble top and hand-finished tapered legs.',
    priceRange: '₹58,000 – ₹1,20,000',
    dimensions: { width: 180, depth: 90, height: 76 },
    finishes: [F.walnutWood, F.charcoalGrey],
    shape: 'dining',
    warranty: '10 Year Warranty',
  },
  {
    id: 'ortho-cloud-mattress',
    name: 'OrthoCloud Mattress',
    category: 'mattresses',
    tagline: 'Sleep beyond boundaries',
    description:
      '5-zone orthopedic support core wrapped in cooling memory foam with breathable knitted quilted cover.',
    priceRange: '₹12,000 – ₹38,000',
    dimensions: { width: 150, depth: 200, height: 25 },
    finishes: [F.ivoryLinen, F.charcoalGrey],
    shape: 'mattress',
    warranty: '10 Year Warranty',
  },
  {
    id: 'lounge-accent-table',
    name: 'Lounge Accent Table',
    category: 'accents',
    tagline: 'The centrepiece your sofa deserves',
    description:
      'Sculptural coffee table in mango wood with brushed brass inlay and tempered glass top option.',
    priceRange: '₹9,000 – ₹22,000',
    dimensions: { width: 120, depth: 60, height: 45 },
    finishes: [F.walnutWood, F.leatherTan, F.charcoalGrey],
    shape: 'table',
    warranty: '5 Year Warranty',
  },
]

export const CONTACT = {
  phones: ['+91 9603077444', '+91 9603177444'],
  whatsapp: 'https://wa.me/919603077444?text=Hi%20Mokshaa%20Enterprises,%20I%20am%20interested%20in%20custom%20furniture.',
  emails: ['info@mokshaaenterprises.com', 'srinug41@gmail.com'],
  addressPrimary:
    'Plot No 84/P, Opp Lakshyam School, Subhash Nagar, Jeedimetla, Hyderabad, Telangana 500055',
  addressBranch: 'Pentapadu, Tadepalligudem, Andhra Pradesh',
  mapEmbed:
    'https://www.google.com/maps?q=Subhash%20Nagar,%20Jeedimetla,%20Hyderabad,%20Telangana%20500055&output=embed',
}
