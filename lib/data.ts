import {
  BarChart3,
  CreditCard,
  MessageCircle,
  Package,
  Share2,
  Sparkles,
  Store,
  Users,
  Wallet,
} from "lucide-react";

import type {
  AvatarItem,
  Creator,
  Feature,
  GalleryItem,
  NavLink,
  PricingPlan,
  Product,
  Step,
  Testimonial,
} from "@/lib/types";

/* ─── Navigation ────────────────────────────────────────── */
export const NAV_LINKS: NavLink[] = [
  { label: "Product", href: "#features", hasDropdown: true },
  { label: "Features", href: "#how-it-works", hasDropdown: true },
  { label: "AI Agents", href: "#agents" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

/* ─── Social Proof Avatars ──────────────────────────────── */
export const PROOF_AVATARS: AvatarItem[] = [
  {
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
    alt: "Teni O.",
  },
  {
    src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=80&q=80",
    alt: "Zainab M.",
  },
  {
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80",
    alt: "Amara B.",
  },
  {
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80",
    alt: "Ngozi A.",
  },
];

/* ─── Featured Creator (Phone Mockup) ───────────────────── */
export const FEATURED_CREATOR: Creator = {
  name: "Zainab M.",
  bio: "Skincare · Beauty · Lifestyle ✨",
  location: "Lagos, Nigeria",
  avatarUrl:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  badge: "⭐ Top Creator",
  followers: "12.4K",
  customers: "8.7K",
  totalSales: "₦24.5M",
};

/* ─── Featured Products (Phone Mockup) ──────────────────── */
export const FEATURED_PRODUCTS: Product[] = [
  {
    name: "Glow Bundle",
    price: "₦25,000",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=70",
  },
  {
    name: "Skincare Guide",
    price: "₦5,000",
    imageUrl:
      "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?auto=format&fit=crop&w=200&q=70",
  },
  {
    name: "1:1 Call",
    price: "₦15,000",
    imageUrl:
      "https://images.unsplash.com/photo-1606814893907-c2e42943c91f?auto=format&fit=crop&w=200&q=70",
  },
];

/* ─── Features ──────────────────────────────────────────── */
export const FEATURES: Feature[] = [
  {
    icon: Store,
    title: "Beautiful Storefronts",
    description:
      "Create a stunning shop that represents your brand in minutes.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Commerce",
    description:
      "Turn chats into customers with smart order flows and quick replies.",
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    description:
      "Track clicks, sales, campaigns, and performance in real time.",
  },
  {
    icon: Users,
    title: "CRM & Follow-ups",
    description:
      "Manage leads, customers, and follow up like a pro in one place.",
  },
  {
    icon: Sparkles,
    title: "AI Growth Assistant",
    description:
      "Generate captions, offers, replies, and campaign ideas with AI.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Get paid easily with Paystack, transfers, deposits, and more.",
  },
];

/* ─── Steps (How It Works) ──────────────────────────────── */
export const STEPS: Step[] = [
  {
    icon: Package,
    number: 1,
    title: "Create your store",
    description: "Set up your beautiful storefront in less than 5 minutes.",
  },
  {
    icon: Share2,
    number: 2,
    title: "Share & attract",
    description:
      "Share your link on Instagram, TikTok, WhatsApp, and more.",
  },
  {
    icon: MessageCircle,
    number: 3,
    title: "Chat & convert",
    description:
      "Engage your audience and turn interest into real orders.",
  },
  {
    icon: Wallet,
    number: 4,
    title: "Get paid & grow",
    description:
      "Receive payments securely and grow your creator business.",
  },
];

/* ─── Testimonials ──────────────────────────────────────── */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Teni O.",
    role: "Skincare Creator · Lagos",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
    quote:
      "Lummy changed the way I sell online. I get more customers from my posts than ever before.",
    rating: 5,
  },
  {
    name: "Daniel E.",
    role: "Fashion Seller · Accra",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
    quote:
      "The WhatsApp features alone are worth it. My customers love the experience.",
    rating: 5,
  },
  {
    name: "Zainab M.",
    role: "Lifestyle Creator · Lagos",
    avatarUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=80&q=80",
    quote:
      "The AI tool helps me create content and offers so fast. My sales have doubled!",
    rating: 5,
  },
];

/* ─── Gallery ───────────────────────────────────────────── */
export const GALLERY_ITEMS: GalleryItem[] = [
  {
    title: "Beauty creators",
    description:
      "Launch storefronts, campaigns, WhatsApp flows, and payment links in minutes.",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Beauty creator applying skincare",
  },
  {
    title: "Fashion sellers",
    description:
      "Showcase your collections and convert Instagram followers with one link.",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Fashion seller in colourful market",
  },
  {
    title: "Digital products",
    description:
      "Sell e-books, courses, templates, and guides with instant delivery.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Digital creator at laptop",
  },
];

/* ─── Pricing ───────────────────────────────────────────── */
export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: "Free",
    price: "₦0",
    period: "Forever free",
    features: [
      "1 storefront + 5 products",
      "WhatsApp CTA links",
      "Basic analytics",
      "Paystack payments",
      "Adaeze (basic WhatsApp agent)",
    ],
    ctaLabel: "Get Started Free",
    ctaHref: "/signup",
    ctaVariant: "outline",
  },
  {
    tier: "Starter",
    price: "₦3,500",
    period: "per month",
    featured: true,
    badge: "⭐ Most Popular",
    features: [
      "Unlimited products & storefronts",
      "WhatsApp click tracking",
      "CRM — leads & customers",
      "Campaign links (Taiwo)",
      "AI tools — Ngozi (20/mo)",
      "Adaeze + Amara agents",
    ],
    ctaLabel: "Start 14-Day Trial",
    ctaHref: "/signup?plan=starter",
    ctaVariant: "solid",
  },
  {
    tier: "Pro",
    price: "₦9,500",
    period: "per month",
    features: [
      "Everything in Starter",
      "All 6 AI agents — unlimited",
      "Emeka — pricing automation",
      "Chidi — weekly insights",
      "Advanced analytics + funnels",
      "Priority support",
    ],
    ctaLabel: "Get Pro",
    ctaHref: "/signup?plan=pro",
    ctaVariant: "outline",
  },
];
