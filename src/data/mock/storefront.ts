import { images } from "@/config/images"
import { mockProducts, mockCreatorProfile, type DashboardProduct } from "@/data/mock/dashboard"

export type StorefrontProduct = DashboardProduct

export interface StorefrontReview {
  id: string
  name: string
  avatar?: string
  rating: number
  comment: string
  productName: string
  date: string
}

export const storefrontReviewSamples: StorefrontReview[] = [
  {
    id: "r1",
    name: "Adaeze O.",
    rating: 5,
    comment: "The Ankara dress is even more beautiful in person. Fast delivery to VI, packaged so well! Will definitely order again 🔥",
    productName: "Ankara Print Dress",
    date: "December 2024",
  },
  {
    id: "r2",
    name: "Kemi A.",
    avatar: images.creators.zara,
    rating: 5,
    comment: "Third order from this store and quality never disappoints. The beaded necklace set was a hit at my sister's engagement 💜",
    productName: "Beaded Necklace Set",
    date: "November 2024",
  },
  {
    id: "r3",
    name: "Funmilayo L.",
    rating: 5,
    comment: "The leather mini bag is worth every kobo. The finish is gorgeous and it looks way more expensive than the price.",
    productName: "Leather Mini Bag",
    date: "November 2024",
  },
  {
    id: "r4",
    name: "Blessing E.",
    avatar: images.creators.nkem,
    rating: 4,
    comment: "Loved the perfume box! One of the scents wasn't my favourite but the other two are amazing. Packaging was very premium.",
    productName: "Perfume Collection Box",
    date: "October 2024",
  },
]

export const storefrontCreator = {
  ...mockCreatorProfile,
  publicProducts: mockProducts.filter((p) => p.status === "active"),
  categories: ["All", ...Array.from(new Set(mockProducts.map((p) => p.category)))],
  reviewSummary: {
    average: 4.9,
    total: 312,
    breakdown: { 5: 270, 4: 32, 3: 7, 2: 2, 1: 1 },
  },
}

export function buildWhatsAppUrl(
  phone: string,
  productName: string,
  formattedPrice: string,
  creatorFirstName: string
): string {
  const cleanPhone = phone.replace(/\D/g, "")
  const text = `Hi ${creatorFirstName}! 👋\n\nI'd like to order from your store:\n\n🛍 ${productName}\n💰 ${formattedPrice}\n\nPlease send me payment and delivery details. Thank you!`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
}

export function buildStoreWhatsAppUrl(phone: string, storeName: string): string {
  const cleanPhone = phone.replace(/\D/g, "")
  const text = `Hi! I'd like to browse ${storeName} on Lummy 👋`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
}
