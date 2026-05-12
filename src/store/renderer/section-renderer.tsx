"use client"

import type { SectionProps, SectionType } from "../schema/types"
import { AnnouncementBarSection } from "../sections/announcement-bar-section"
import { HeroSection } from "../sections/hero-section"
import { CreatorBioSection } from "../sections/creator-bio-section"
import { ProductGridSection } from "../sections/product-grid-section"
import { FeaturedCollectionSection } from "../sections/featured-collection-section"
import { TestimonialsSection } from "../sections/testimonials-section"
import { CTASection } from "../sections/cta-section"
import { FAQSection } from "../sections/faq-section"
import { SocialLinksSection } from "../sections/social-links-section"
import { GallerySection } from "../sections/gallery-section"
import type React from "react"

const SECTION_MAP: Record<SectionType, React.ComponentType<SectionProps>> = {
  AnnouncementBar: AnnouncementBarSection,
  Hero: HeroSection,
  CreatorBio: CreatorBioSection,
  ProductGrid: ProductGridSection,
  FeaturedCollection: FeaturedCollectionSection,
  Testimonials: TestimonialsSection,
  Gallery: GallerySection,
  CTA: CTASection,
  FAQ: FAQSection,
  SocialLinks: SocialLinksSection,
}

export function SectionRenderer(props: SectionProps) {
  const Component = SECTION_MAP[props.section.type]
  if (!Component) return null
  return <Component {...props} />
}
