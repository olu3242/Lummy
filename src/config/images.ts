/**
 * Centralized image configuration.
 * Replace Unsplash URLs with production assets when ready.
 */

const UNS = "https://images.unsplash.com"

export const images = {
  // Creator avatars (portraits)
  creators: {
    sade: `${UNS}/photo-1531746804-9509cd12c74a?w=200&h=200&fit=crop&q=80&auto=format`,
    chioma: `${UNS}/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80&auto=format`,
    amaka: `${UNS}/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80&auto=format`,
    david: `${UNS}/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80&auto=format`,
    kwame: `${UNS}/photo-1500048993953-d23a436266cf?w=200&h=200&fit=crop&q=80&auto=format`,
    fatima: `${UNS}/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80&auto=format`,
    zara: `${UNS}/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&q=80&auto=format`,
    nkem: `${UNS}/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&q=80&auto=format`,
  },

  // Creator store cover images (wide landscape)
  covers: {
    fashion: `${UNS}/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop&q=80&auto=format`,
    food: `${UNS}/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop&q=80&auto=format`,
    tech: `${UNS}/photo-1518770660439-4636190af475?w=800&h=500&fit=crop&q=80&auto=format`,
    beauty: `${UNS}/photo-1596462502278-27bfdc403348?w=800&h=500&fit=crop&q=80&auto=format`,
    music: `${UNS}/photo-1511671782779-c97d3d27a1d4?w=800&h=500&fit=crop&q=80&auto=format`,
    lifestyle: `${UNS}/photo-1483985988355-763728e1935b?w=800&h=500&fit=crop&q=80&auto=format`,
  },

  // Product images
  products: {
    dress: `${UNS}/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop&q=80&auto=format`,
    necklace: `${UNS}/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&q=80&auto=format`,
    bag: `${UNS}/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop&q=80&auto=format`,
    sneakers: `${UNS}/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&q=80&auto=format`,
    perfume: `${UNS}/photo-1541643600914-78b084683702?w=400&h=400&fit=crop&q=80&auto=format`,
    skincare: `${UNS}/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop&q=80&auto=format`,
  },

  // Hero & marketing visuals
  hero: {
    phoneScreen: `${UNS}/photo-1523275335684-37898b6baf30?w=600&h=1200&fit=crop&q=80&auto=format`,
    africaCity: `${UNS}/photo-1578985545062-69928b1d9587?w=1600&h=900&fit=crop&q=80&auto=format`,
    creatorWorking: `${UNS}/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80&auto=format`,
  },

  // Logo / brand
  logo: "/logo.svg",
} as const

export type ImageKey = keyof typeof images
