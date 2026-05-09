import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { FeatureStripSection } from "@/components/sections/feature-strip-section"
import { WorkflowSection } from "@/components/sections/workflow-section"
import { WhatsAppSection } from "@/components/sections/whatsapp-section"
import { CreatorGallerySection } from "@/components/sections/creator-gallery-section"
import { AIAssistantSection } from "@/components/sections/ai-assistant-section"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { PricingSection } from "@/components/sections/pricing-section"
import { FAQSection } from "@/components/sections/faq-section"
import { CTASection } from "@/components/sections/cta-section"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeatureStripSection />
        <WorkflowSection />
        <WhatsAppSection />
        <CreatorGallerySection />
        <AIAssistantSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
