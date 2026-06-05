import { images } from "@/config/images"

export interface Creator {
  id: string
  name: string
  handle: string
  niche: string
  location: string
  avatar: string
  cover: string
  revenue: string
  followers: string
  products: number
  verified: boolean
  bio: string
}

export interface Testimonial {
  id: string
  name: string
  handle: string
  niche: string
  avatar: string
  content: string
  metric: string
  metricLabel: string
  rating: number
}

export interface PricingPlan {
  id: string
  name: string
  price: string
  priceSubtext: string
  description: string
  features: string[]
  cta: string
  popular: boolean
  accent: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface Feature {
  id: string
  icon: string
  title: string
  description: string
  color: string
}

export interface WorkflowStep {
  step: string
  title: string
  description: string
  icon: string
}

// Creators
export const mockCreators: Creator[] = [
  {
    id: "1",
    name: "Zara Bello",
    handle: "@zara.studio",
    niche: "Fashion & Beauty",
    location: "Lagos, Nigeria",
    avatar: images.creators.sade,
    cover: images.covers.fashion,
    revenue: "$2.4k",
    followers: "45.2k",
    products: 23,
    verified: true,
    bio: "Curator of Afrocentric fashion and modern African identity.",
  },
  {
    id: "2",
    name: "Chioma Ifedi",
    handle: "@chioma.cooks",
    niche: "Food & Lifestyle",
    location: "Abuja, Nigeria",
    avatar: images.creators.chioma,
    cover: images.covers.food,
    revenue: "$1.8k",
    followers: "38.7k",
    products: 14,
    verified: true,
    bio: "Bringing authentic Nigerian flavours to your table.",
  },
  {
    id: "3",
    name: "Amaka Nwosu",
    handle: "@amaka.glam",
    niche: "Hair & Beauty",
    location: "Enugu, Nigeria",
    avatar: images.creators.amaka,
    cover: images.covers.beauty,
    revenue: "$950",
    followers: "21.3k",
    products: 31,
    verified: false,
    bio: "Protective styles, locs and everything natural.",
  },
  {
    id: "4",
    name: "David Eze",
    handle: "@david.techng",
    niche: "Tech & Reviews",
    location: "Lagos, Nigeria",
    avatar: images.creators.david,
    cover: images.covers.tech,
    revenue: "$1.2k",
    followers: "29.4k",
    products: 8,
    verified: true,
    bio: "Honest gadget reviews for the African market.",
  },
  {
    id: "5",
    name: "Kwame Mensah",
    handle: "@kwame.music",
    niche: "Music & Merch",
    location: "Accra, Ghana",
    avatar: images.creators.kwame,
    cover: images.covers.music,
    revenue: "GH₵ 28k",
    followers: "62.1k",
    products: 12,
    verified: true,
    bio: "Afrobeats artist selling merch and exclusive beats.",
  },
  {
    id: "6",
    name: "Fatima Al-Hassan",
    handle: "@fatima.modest",
    niche: "Modest Fashion",
    location: "Kano, Nigeria",
    avatar: images.creators.fatima,
    cover: images.covers.lifestyle,
    revenue: "$720",
    followers: "17.8k",
    products: 19,
    verified: false,
    bio: "Elegant modest wear for the contemporary Muslim woman.",
  },
]

// Testimonials
export const mockTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Chioma Ifedi",
    handle: "@chioma.cooks",
    niche: "Food Creator · Abuja",
    avatar: images.creators.chioma,
    content:
      "Before Lummy, every order felt manual. Now customers can understand my offers, place orders faster, and come back without me explaining everything again.",
    metric: "3x",
    metricLabel: "more repeat customers",
    rating: 5,
  },
  {
    id: "2",
    name: "Zara Bello",
    handle: "@zara.studio",
    niche: "Fashion Creator · Lagos",
    avatar: images.creators.sade,
    content:
      "I finally look like a serious business online. My storefront feels professional, and customers trust the buying experience much more than my old link-in-bio.",
    metric: "5x",
    metricLabel: "stronger buyer confidence",
    rating: 5,
  },
  {
    id: "3",
    name: "Kwame Mensah",
    handle: "@kwame.music",
    niche: "Musician · Accra",
    avatar: images.creators.kwame,
    content:
      "I launched merch the same week as my release. The setup was fast enough that I could focus on promotion instead of building a sales process from scratch.",
    metric: "Hours",
    metricLabel: "from idea to launch",
    rating: 5,
  },
  {
    id: "4",
    name: "Amaka Nwosu",
    handle: "@amaka.glam",
    niche: "Beauty Creator · Enugu",
    avatar: images.creators.amaka,
    content:
      "Lummy gave me one place to manage my products, buyers, and follow-ups. I spend less time organizing orders and more time growing the business.",
    metric: "1 place",
    metricLabel: "to manage sales",
    rating: 5,
  },
]

// Pricing plans
export const mockPricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    priceSubtext: "Forever",
    description: "For creators just starting to sell.",
    features: [
      "1 creator storefront",
      "Up to 10 products",
      "WhatsApp order links",
      "Basic analytics",
      "Lummy subdomain",
      "Community support",
    ],
    cta: "Start for Free",
    popular: false,
    accent: "from-slate-400 to-slate-600",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$9",
    priceSubtext: "per month",
    description: "For creators ready to scale.",
    features: [
      "3 storefronts",
      "Unlimited products",
      "Intelligent growth support",
      "Customer and order tracking",
      "Performance insights",
      "Custom domain support",
      "Priority support",
      "Campaign support",
    ],
    cta: "Start Growing",
    popular: true,
    accent: "from-brand-purple to-brand-indigo",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    priceSubtext: "per month",
    description: "For creator businesses at scale.",
    features: [
      "Unlimited storefronts",
      "Team accounts (5 seats)",
      "White-label option",
      "Advanced business controls",
      "Dedicated account manager",
      "Migration support",
      "Priority reliability support",
      "Early access to new growth tools",
    ],
    cta: "Go Pro",
    popular: false,
    accent: "from-brand-coral to-orange-600",
  },
]

// FAQ items
export const mockFAQItems: FAQItem[] = [
  {
    id: "1",
    question: "What exactly is Lummy?",
    answer:
      "Lummy helps creators and small businesses launch a professional storefront, sell products or services, and manage customer activity without building a website or juggling multiple tools.",
  },
  {
    id: "2",
    question: "How quickly can I start selling?",
    answer:
      "Most creators can create a storefront, add an offer, and share a selling link the same day. You do not need design, coding, or technical setup experience.",
  },
  {
    id: "3",
    question: "Do I need technical skills?",
    answer:
      "No. Lummy is designed for creators who want a simple way to sell online without learning website builders, checkout tools, or business software.",
  },
  {
    id: "4",
    question: "Can I sell products and services?",
    answer:
      "Yes. You can sell physical products, services, bookings, digital offers, and simple bundles from one storefront.",
  },
  {
    id: "5",
    question: "How do I get paid?",
    answer:
      "Customers pay through a secure checkout experience, and supported payout options depend on your country and payment provider availability.",
  },
  {
    id: "6",
    question: "Can I customize my storefront?",
    answer:
      "Yes. You can update your store name, handle, description, logo, colors, product images, and brand details so your storefront feels like your business.",
  },
  {
    id: "7",
    question: "Do customers need an account?",
    answer:
      "No. Customers can browse your storefront and start buying without creating a Lummy account.",
  },
  {
    id: "8",
    question: "Why should I trust Lummy?",
    answer:
      "Lummy is built around secure payments, privacy-conscious account handling, and reliable storefront infrastructure so creators can sell with confidence.",
  },
]

// Workflow steps
export const mockWorkflowSteps: WorkflowStep[] = [
  {
    step: "01",
    title: "Create a Post",
    description: "Upload your product or service content just like a social post. Photo, video, or digital file.",
    icon: "Share2",
  },
  {
    step: "02",
    title: "List It for Sale",
    description: "Set your price, add a description, and publish to your Lummy storefront in under 2 minutes.",
    icon: "Store",
  },
  {
    step: "03",
    title: "Share the Link",
    description: "Share your store link in your bio, stories, or broadcast it directly on WhatsApp.",
    icon: "MessageCircle",
  },
  {
    step: "04",
    title: "Get Paid",
    description: "Orders come in via WhatsApp. Customers pay online. Money lands in your account.",
    icon: "Wallet",
  },
]

// Stats
export const mockStats = [
  { value: "3x", label: "More repeat customers" },
  { value: "Hours", label: "From idea to storefront" },
  { value: "1", label: "Place to manage sales" },
  { value: "Secure", label: "Checkout-ready business" },
]

// Social proof avatars (compact list for hero)
export const mockHeroAvatars = [
  images.creators.sade,
  images.creators.chioma,
  images.creators.amaka,
  images.creators.david,
  images.creators.kwame,
]

// Nav items
export const navItems = [
  { label: "Benefits", href: "#features" },
  { label: "How It Works", href: "#workflow" },
  { label: "Stories", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]
