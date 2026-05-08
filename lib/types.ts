import type { LucideIcon } from "lucide-react";

/* ─── Feature ───────────────────────────────────────────── */
export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

/* ─── Step ──────────────────────────────────────────────── */
export interface Step {
  icon: LucideIcon;
  number: number;
  title: string;
  description: string;
}

/* ─── Gallery Item ──────────────────────────────────────── */
export interface GalleryItem {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
}

/* ─── Testimonial ───────────────────────────────────────── */
export interface Testimonial {
  name: string;
  role: string;
  avatarUrl: string;
  quote: string;
  rating: number;
}

/* ─── Creator (Storefront preview) ─────────────────────── */
export interface Creator {
  name: string;
  bio: string;
  location: string;
  avatarUrl: string;
  badge: string;
  followers: string;
  customers: string;
  totalSales: string;
}

/* ─── Product (Storefront preview) ─────────────────────── */
export interface Product {
  name: string;
  price: string;
  imageUrl: string;
}

/* ─── Pricing Plan ──────────────────────────────────────── */
export interface PricingPlan {
  tier: string;
  price: string;
  period: string;
  featured?: boolean;
  badge?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "outline" | "solid";
}

/* ─── Navigation Link ───────────────────────────────────── */
export interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

/* ─── Social Proof ──────────────────────────────────────── */
export interface AvatarItem {
  src: string;
  alt: string;
}
