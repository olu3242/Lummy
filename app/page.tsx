import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesStrip } from "@/components/sections/FeaturesStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { GallerySection } from "@/components/sections/GallerySection";
import { CtaSection } from "@/components/sections/CtaSection";

/**
 * Home page — pure server component.
 * Each section is independently importable and tree-shakeable.
 * Client interactivity is delegated to leaf components only.
 */
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesStrip />
        <HowItWorks />
        <GallerySection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
