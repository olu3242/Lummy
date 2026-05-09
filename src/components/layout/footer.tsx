import Link from "next/link"
import { Zap, Twitter, Instagram, Linkedin, Youtube } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Creator Gallery", href: "#gallery" },
    { label: "AI Assistant", href: "#ai" },
    { label: "WhatsApp Commerce", href: "#whatsapp" },
    { label: "Changelog", href: "#" },
  ],
  Creators: [
    { label: "Success Stories", href: "#testimonials" },
    { label: "Creator Community", href: "#" },
    { label: "Refer a Creator", href: "#" },
    { label: "Creator Blog", href: "#" },
  ],
  Company: [
    { label: "About Lummy", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press Kit", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Refund Policy", href: "#" },
  ],
}

const socials = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
]

export function Footer() {
  return (
    <footer className="bg-brand-midnight border-t border-white/8">
      {/* Main grid */}
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand col */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">Lummy</span>
            </Link>
            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
              The creator commerce OS for Africa. Turn your followers into customers with storefronts, WhatsApp orders, and AI-powered growth tools.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
                {category}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-white/8" />

      {/* Bottom bar */}
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
        <p className="text-xs text-white/30">
          © 2025 Lummy Technologies Ltd. · Built for African creators.
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-white/30">Made with</span>
          <span className="text-brand-coral text-xs">♥</span>
          <span className="text-xs text-white/30">in Lagos</span>
        </div>
      </div>
    </footer>
  )
}
