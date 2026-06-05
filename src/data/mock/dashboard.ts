import { images } from "@/config/images"

// ─── Revenue / Analytics ──────────────────────────────────────────────────────

export const mockRevenueData = [
  { month: "Jan", revenue: 120000, orders: 45 },
  { month: "Feb", revenue: 145000, orders: 52 },
  { month: "Mar", revenue: 132000, orders: 48 },
  { month: "Apr", revenue: 189000, orders: 71 },
  { month: "May", revenue: 215000, orders: 83 },
  { month: "Jun", revenue: 241000, orders: 95 },
  { month: "Jul", revenue: 198000, orders: 74 },
  { month: "Aug", revenue: 267000, orders: 102 },
  { month: "Sep", revenue: 312000, orders: 124 },
  { month: "Oct", revenue: 289000, orders: 109 },
  { month: "Nov", revenue: 341000, orders: 137 },
  { month: "Dec", revenue: 394000, orders: 158 },
]

export const mockWeeklyData = [
  { day: "Mon", revenue: 28400, orders: 11 },
  { day: "Tue", revenue: 42100, orders: 17 },
  { day: "Wed", revenue: 35700, orders: 14 },
  { day: "Thu", revenue: 61200, orders: 24 },
  { day: "Fri", revenue: 89400, orders: 35 },
  { day: "Sat", revenue: 112300, orders: 44 },
  { day: "Sun", revenue: 76800, orders: 31 },
]

export const mockOrderSources = [
  { name: "WhatsApp", value: 58, color: "#25D366" },
  { name: "Direct Link", value: 24, color: "#6C4EF3" },
  { name: "Instagram Bio", value: 11, color: "#F97316" },
  { name: "TikTok Link", value: 7, color: "#FF2D55" },
]

// ─── Dashboard KPI Cards ───────────────────────────────────────────────────────

export interface StatCard {
  id: string
  label: string
  value: string
  rawValue: number
  change: string
  trend: "up" | "down" | "neutral"
  suffix?: string
  icon: string
  color: string
  bg: string
}

export const mockDashboardStats: StatCard[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: "$847",
    rawValue: 847,
    change: "+28.4%",
    trend: "up",
    icon: "Wallet",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
  {
    id: "orders",
    label: "Total Orders",
    value: "1,234",
    rawValue: 1234,
    change: "+12.1%",
    trend: "up",
    icon: "ShoppingBag",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
  },
  {
    id: "views",
    label: "Store Views",
    value: "18,429",
    rawValue: 18429,
    change: "+34.7%",
    trend: "up",
    icon: "Eye",
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
  },
  {
    id: "conversion",
    label: "Conversion Rate",
    value: "6.7%",
    rawValue: 6.7,
    change: "+0.8%",
    trend: "up",
    icon: "TrendingUp",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
]

// ─── Products ─────────────────────────────────────────────────────────────────

export interface DashboardProduct {
  id: string
  name: string
  description: string
  price: number
  currency?: string
  image: string
  category: string
  status: "active" | "draft" | "sold_out"
  sales: number
  views: number
  revenue: number
  stock: number | null
  whatsappEnabled: boolean
  createdAt: string
}

export const mockProducts: DashboardProduct[] = [
  {
    id: "p1",
    name: "Ankara Print Dress",
    description: "Bold Afrocentric print in premium cotton blend. Available S–XL.",
    price: 20,
    currency: "USD",
    image: images.products.dress,
    category: "Clothing",
    status: "active",
    sales: 87,
    views: 1243,
    revenue: 1740,
    stock: 14,
    whatsappEnabled: true,
    createdAt: "2024-10-05",
  },
  {
    id: "p2",
    name: "Beaded Necklace Set",
    description: "Hand-crafted beadwork. Every piece is unique.",
    price: 8,
    currency: "USD",
    image: images.products.necklace,
    category: "Jewellery",
    status: "active",
    sales: 134,
    views: 2891,
    revenue: 1072,
    stock: 32,
    whatsappEnabled: true,
    createdAt: "2024-09-18",
  },
  {
    id: "p3",
    name: "Leather Mini Bag",
    description: "Genuine leather mini bag with gold hardware. Multiple colours.",
    price: 15,
    currency: "USD",
    image: images.products.bag,
    category: "Accessories",
    status: "active",
    sales: 56,
    views: 981,
    revenue: 840,
    stock: 8,
    whatsappEnabled: true,
    createdAt: "2024-11-01",
  },
  {
    id: "p4",
    name: "Perfume Collection Box",
    description: "3-piece artisan fragrance set, African-inspired scents.",
    price: 25,
    currency: "USD",
    image: images.products.perfume,
    category: "Beauty",
    status: "active",
    sales: 29,
    views: 672,
    revenue: 725,
    stock: 5,
    whatsappEnabled: false,
    createdAt: "2024-11-12",
  },
  {
    id: "p5",
    name: "Sneaker Collab Drop",
    description: "Limited street art collab. Sizes 38–45.",
    price: 30,
    currency: "USD",
    image: images.products.sneakers,
    category: "Footwear",
    status: "sold_out",
    sales: 50,
    views: 3124,
    revenue: 1500,
    stock: 0,
    whatsappEnabled: true,
    createdAt: "2024-08-20",
  },
  {
    id: "p6",
    name: "Glow Skincare Bundle",
    description: "4-step skincare routine. For all skin tones.",
    price: 15,
    currency: "USD",
    image: images.products.skincare,
    category: "Beauty",
    status: "draft",
    sales: 0,
    views: 0,
    revenue: 0,
    stock: 20,
    whatsappEnabled: false,
    createdAt: "2024-12-01",
  },
]

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"

export interface DashboardOrder {
  id: string
  orderNumber: string
  customer: { name: string; phone: string; avatar?: string }
  product: { name: string; image: string }
  amount: number
  currency?: string
  status: OrderStatus
  source: "whatsapp" | "direct" | "instagram" | "tiktok"
  createdAt: string
  deliveryAddress: string
}

export const mockOrders: DashboardOrder[] = [
  {
    id: "o1",
    orderNumber: "LMY-00234",
    customer: { name: "Adaeze Okonkwo", phone: "+234 803 456 7890" },
    product: { name: "Ankara Print Dress", image: images.products.dress },
    amount: 20,
    currency: "USD",
    status: "delivered",
    source: "whatsapp",
    createdAt: "2024-12-05",
    deliveryAddress: "45 Adeola Odeku St, Victoria Island, Lagos",
  },
  {
    id: "o2",
    orderNumber: "LMY-00235",
    customer: { name: "Kemi Adeyemi", phone: "+234 812 345 6789" },
    product: { name: "Beaded Necklace Set", image: images.products.necklace },
    amount: 8,
    currency: "USD",
    status: "shipped",
    source: "instagram",
    createdAt: "2024-12-06",
    deliveryAddress: "12 Awolowo Road, Ikoyi, Lagos",
  },
  {
    id: "o3",
    orderNumber: "LMY-00236",
    customer: { name: "Blessing Eze", phone: "+234 701 234 5678" },
    product: { name: "Leather Mini Bag", image: images.products.bag },
    amount: 15,
    currency: "USD",
    status: "processing",
    source: "whatsapp",
    createdAt: "2024-12-07",
    deliveryAddress: "3 Bourdillon Road, Ikoyi, Lagos",
  },
  {
    id: "o4",
    orderNumber: "LMY-00237",
    customer: { name: "Ngozi Ikenna", phone: "+234 908 765 4321" },
    product: { name: "Perfume Collection Box", image: images.products.perfume },
    amount: 25,
    currency: "USD",
    status: "confirmed",
    source: "direct",
    createdAt: "2024-12-08",
    deliveryAddress: "7 Kofo Abayomi St, Victoria Island, Lagos",
  },
  {
    id: "o5",
    orderNumber: "LMY-00238",
    customer: { name: "Tunde Balogun", phone: "+234 805 123 4567" },
    product: { name: "Ankara Print Dress", image: images.products.dress },
    amount: 20,
    currency: "USD",
    status: "pending",
    source: "whatsapp",
    createdAt: "2024-12-08",
    deliveryAddress: "21 Broad Street, Lagos Island, Lagos",
  },
  {
    id: "o6",
    orderNumber: "LMY-00239",
    customer: { name: "Chiamaka Obi", phone: "+234 803 987 6543" },
    product: { name: "Beaded Necklace Set", image: images.products.necklace },
    amount: 8,
    currency: "USD",
    status: "cancelled",
    source: "tiktok",
    createdAt: "2024-12-04",
    deliveryAddress: "14 Ozumba Mbadiwe, Victoria Island, Lagos",
  },
  {
    id: "o7",
    orderNumber: "LMY-00240",
    customer: { name: "Funmi Olawale", phone: "+234 816 543 2109" },
    product: { name: "Leather Mini Bag", image: images.products.bag },
    amount: 15,
    currency: "USD",
    status: "delivered",
    source: "whatsapp",
    createdAt: "2024-12-03",
    deliveryAddress: "9 Akin Adesola St, Victoria Island, Lagos",
  },
  {
    id: "o8",
    orderNumber: "LMY-00241",
    customer: { name: "Yewande Ajayi", phone: "+234 702 345 6789" },
    product: { name: "Ankara Print Dress", image: images.products.dress },
    amount: 20,
    currency: "USD",
    status: "shipped",
    source: "instagram",
    createdAt: "2024-12-07",
    deliveryAddress: "56 Glover Road, Ikoyi, Lagos",
  },
]

// ─── Store settings (mock creator profile) ────────────────────────────────────

export const mockCreatorProfile = {
  name: "Creator",
  handle: "your-store",
  email: "sade@example.com",
  phone: "+234 803 456 7890",
  whatsapp: "+234 803 456 7890",
  bio: "Curator of Afrocentric fashion and modern African identity. Delivering quality since 2021.",
  niche: "Fashion & Beauty",
  location: "Lagos, Nigeria",
  avatar: images.creators.sade,
  cover: images.covers.fashion,
  storeName: "Your Store",
  storeUrl: "lummy.co/your-store",
  verified: true,
  joinedAt: "2024-02-10",
  stats: {
    totalRevenue: 2847000,
    totalOrders: 1234,
    storeViews: 18429,
    avgRating: 4.9,
    reviewCount: 312,
  },
  socialLinks: {
    instagram: "@yourhandle",
    tiktok: "@sadeafro",
    twitter: "@sade_styles",
  },
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export const mockNotifications = [
  {
    id: "n1",
    type: "order",
    title: "New order received",
    body: "Adaeze Okonkwo ordered Ankara Print Dress",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: "n2",
    type: "payment",
    title: "Payment confirmed",
    body: "$25 from Ngozi Ikenna · LMY-00237",
    time: "14 minutes ago",
    read: false,
  },
  {
    id: "n3",
    type: "ai",
    title: "AI suggestion ready",
    body: "Your weekly campaign brief is ready to review",
    time: "1 hour ago",
    read: true,
  },
  {
    id: "n4",
    type: "store",
    title: "Store milestone 🎉",
    body: "You've reached 1,000 store visits this month!",
    time: "3 hours ago",
    read: true,
  },
]

// ─── Quick actions ─────────────────────────────────────────────────────────────

export const mockQuickActions = [
  { label: "Add Product", icon: "Plus", color: "bg-brand-purple/10 text-brand-purple", href: "/dashboard/products/new" },
  { label: "Share Store", icon: "Share2", color: "bg-brand-green/10 text-brand-green", href: "#" },
  { label: "AI Caption", icon: "Sparkles", color: "bg-brand-coral/10 text-brand-coral", href: "/dashboard/ai" },
  { label: "View Store", icon: "ExternalLink", color: "bg-amber-500/10 text-amber-500", href: "#" },
]
