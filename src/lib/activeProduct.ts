import { useEffect, useState } from 'react'
import type { Product } from '../data/products'

const WHATSAPP_NUMBER = '919603077444'

let activeProduct: Product | null = null
const listeners = new Set<(p: Product | null) => void>()

export function setActiveProduct(product: Product | null) {
  activeProduct = product
  listeners.forEach((l) => l(product))
}

export function getActiveProduct(): Product | null {
  return activeProduct
}

export function subscribeActiveProduct(listener: (p: Product | null) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useActiveProduct(): Product | null {
  const [product, setProduct] = useState<Product | null>(getActiveProduct())
  useEffect(() => subscribeActiveProduct(setProduct), [])
  return product
}

export function buildWhatsAppMessage(productName?: string | null): string {
  const name = productName || activeProduct?.name || 'the Active Showroom Piece'
  return `Hello Mokshaa Enterprises, I would like a custom quote for the ${name}`
}

export function buildWhatsAppLink(productName?: string | null): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(productName))}`
}