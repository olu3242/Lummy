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
    name: "Sade Okoye",
    handle: "@sade.styles",
    niche: "Fashion & Beauty",
    location: "Lagos, Nigeria",
    avatar: images.creators.sade,
    cover: images.covers.fashion,
    revenue: "₦2.4M",
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
    revenue: "₦1.8M",
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
    revenue: "₦950k",
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
    revenue: "₦1.2M",
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
    revenue: "₦720k",
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
      "Before Lummy I was manually sending payment details in every DM. Now my WhatsApp store runs itself. I cleared ₦1.2M in my first 3 months — during a slow season.",
    metric: "₦1.2M",
    metricLabel: "in 3 months",
    rating: 5,
  },
  {
    id: "2",
    name: "Sade Okoye",
    handle: "@sade.styles",
    niche: "Fashion Creator · Lagos",
    avatar: images.creators.sade,
    content:
      "The AI assistant writes my product descriptions, my captions, even my WhatsApp reply templates. It sounds exactly like me. My store now converts 5x better than my old link-in-bio.",
    metric: "5×",
    metricLabel: "conversion uplift",
    rating: 5,
  },
  {
    id: "3",
    name: "Kwame Mensah",
    handle: "@kwame.music",
    niche: "Musician · Accra",
    avatar: images.creators.kwame,
    content:
      "I dropped merch the same week I dropped a single. Lummy's storefront handled every order. I made $2,000 in 48 hours without touching a spreadsheet or messaging anyone individually.",
    metric: "$2,000",
    metricLabel: "in 48 hours",
    rating: 5,
  },
  {
    id: "4",
    name: "Amaka Nwosu",
    handle: "@amaka.glam",
    niche: "Beauty Creator · Enugu",
    avatar: images.creators.amaka,
    content:
      "Lummy gave me a proper business. Not just a page — a real storefront with analytics, WhatsApp orders, and a CRM for my repeat customers. Revenue up 200% in 60 days.",
    metric: "+200%",
    metricLabel: "revenue growth",
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
    price: "₦5,000",
    priceSubtext: "per month",
    description: "For creators ready to scale.",
    features: [
      "3 storefronts",
      "Unlimited products",
      "AI growth assistant",
      "CRM & customer tracking",
      "Advanced analytics",
      "Custom domain support",
      "Priority support",
      "WhatsApp broadcast (coming soon)",
    ],
    cta: "Start Growing",
    popular: true,
    accent: "from-brand-purple to-brand-indigo",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₦15,000",
    priceSubtext: "per month",
    description: "For creator businesses at scale.",
    features: [
      "Unlimited storefronts",
      "Team accounts (5 seats)",
      "White-label option",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "Early access to all features",
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
      "Lummy is a creator commerce operating system built for Africa. It lets you create a beautiful storefront, list your products or services, and receive orders directly via WhatsApp — all without building a website or using complex tools.",
  },
  {
    id: "2",
    question: "How does the WhatsApp commerce flow work?",
    answer:
      "When a customer clicks on a product, Lummy generates a pre-filled WhatsApp message with the order details. The message goes to your WhatsApp number. You confirm, they pay — simple. No bot required, no tech setup.",
  },
  {
    id: "3",
    question: "Which payment methods are supported?",
    answer:
      "Lummy integrates with Paystack (primary) and Flutterwave (secondary). Your customers can pay by card, bank transfer, USSD, or mobile money depending on their country. More local payment methods are being added regularly.",
  },
  {
    id: "4",
    question: "Is my money safe? When do I receive payouts?",
    answer:
      "All payment processing is handled by Paystack and Flutterwave — both regulated and PCI-compliant. Payouts are made to your bank account within 24–72 hours of settlement, depending on your tier.",
  },
  {
    id: "5",
    question: "Can I use Lummy outside Nigeria?",
    answer:
      "Yes. Lummy is built for Africa. It currently supports creators in Nigeria, Ghana, Kenya, and South Africa with local currency support. More countries are being added based on demand.",
  },
  {
    id: "6",
    question: "What does the AI growth assistant actually do?",
    answer:
      "The AI assistant is powered by Claude (Anthropic). It writes product descriptions, social captions, WhatsApp reply templates, pricing suggestions, and campaign ideas — all in your voice and for your specific niche.",
  },
  {
    id: "7",
    question: "What are the transaction fees?",
    answer:
      "Lummy charges 0% platform fees on the Starter plan. Growth and Pro plans pay 1.5% per transaction (capped at ₦2,500). Payment gateway fees (Paystack/Flutterwave) of ~1.5% apply separately.",
  },
  {
    id: "8",
    question: "Can I migrate my existing products or store?",
    answer:
      "Yes. You can import products via CSV or from a link. Our onboarding team can help you migrate from Selar, Flutterwave Storefront, or any other platform. Book a free migration call from your dashboard.",
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
  { value: "2,000+", label: "Active Creators" },
  { value: "₦500M+", label: "Revenue Processed" },
  { value: "4.9 ★", label: "Average Rating" },
  { value: "12", label: "African Markets" },
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
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#workflow" },
  { label: "Creators", href: "#gallery" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]
