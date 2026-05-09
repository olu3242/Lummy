"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useScroll } from "@/hooks/use-scroll";
import { NAV_LINKS } from "@/lib/data";
import { cn } from "@/lib/cn";

/**
 * Site-wide navigation bar.
 *
 * - Scroll-aware: switches from transparent → opaque background on scroll
 * - Mobile: collapses to hamburger menu with full-width overlay drawer
 * - Accessibility: proper aria-labels on toggle, keyboard-navigable
 */
export function Navbar() {
  const scrolled = useScroll({ threshold: 50 });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header
        role="banner"
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-[70px] items-center px-6",
          "border-b border-white/6 transition-all duration-300",
          "backdrop-blur-2xl -webkit-backdrop-blur-2xl",
          scrolled ? "bg-dark/95" : "bg-dark/70"
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link href="/" aria-label="Lummy — Go to homepage">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-white/80 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="text-sm font-semibold text-white/80 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => (window.location.href = "/signup")}
            >
              Start for Free
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/90 backdrop-blur lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          className={cn(
            "fixed inset-x-0 top-[70px] z-40",
            "flex flex-col gap-5 px-6 py-6",
            "border-b border-white/6 bg-dark/98 backdrop-blur-2xl",
            "lg:hidden"
          )}
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-base font-semibold text-white/80 transition-colors hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 flex flex-col gap-3 border-t border-white/8 pt-4">
            <Link
              href="/login"
              className="text-base font-semibold text-white/70"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => (window.location.href = "/signup")}
            >
              Start for Free
            </Button>
          </div>
        </nav>
      )}
    </>
  );
}
