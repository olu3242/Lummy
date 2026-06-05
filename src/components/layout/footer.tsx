import Link from "next/link"
import Image from "next/image"
import { Twitter, Instagram, Linkedin, Youtube } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { BRAND } from "@/config/branding"

const footerLinks = {
  Company: [
    { label: "About", href: "/#features" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Contact", href: "mailto:support@lummy.com" },
    { label: "Partners", href: "/partner-program" },
    { label: "Affiliates", href: "/affiliate-program" },
  ],
  Creators: [
    { label: "Storefronts", href: "/signup" },
    { label: "Products", href: "/#features" },
    { label: "Growth", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Success Stories", href: "/#testimonials" },
    { label: "Discover Creators", href: "/discover" },
  ],
  Support: [
    { label: "Help Center", href: "/dashboard/help" },
    { label: "Contact Support", href: "mailto:support@lummy.com" },
    { label: "Status", href: "/status" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  Trust: [
    { label: "Security", href: "/security" },
    { label: "Privacy", href: "/privacy" },
    { label: "Compliance", href: "/compliance" },
    { label: "Trust Center", href: "/trust" },
  ],
  Legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Cookies", href: "/cookies" },
    { label: "Refunds", href: "/refunds" },
    { label: "Acceptable Use", href: "/acceptable-use" },
  ],
  Compliance: [
    { label: "Payments", href: "/legal/payments" },
    { label: "Merchant Terms", href: "/legal/merchant-terms" },
    { label: "Chargebacks", href: "/legal/chargebacks" },
    { label: "Prohibited Businesses", href: "/legal/prohibited-businesses" },
    { label: "Platform Fees", href: "/legal/platform-fees" },
  ],
}

const securityCommitments = [
  "Encryption in Transit",
  "Encryption at Rest",
  "Role-Based Access Controls",
  "Audit Logging",
  "Secure Payments",
  "Account Protection",
  "Multi-Tenant Isolation",
  "Disaster Recovery",
]

const certificationRoadmap = [
  "SOC 2 Type I",
  "SOC 2 Type II",
  "ISO 27001",
  "GDPR Compliance",
  "CCPA Compliance",
  "NDPA Compliance",
  "PCI-DSS Alignment",
]

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
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 xl:grid-cols-7">
          {/* Brand col */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <Image src={BRAND.logo} alt={BRAND.name} width={32} height={32} className="h-8 w-8 rounded-xl" />
              <span className="font-display text-xl font-bold text-white">{BRAND.name}</span>
            </Link>
            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
              {BRAND.name} helps creators and businesses launch, sell, and grow online from anywhere in the world.
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

      <div className="container py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Security Commitments</p>
            <div className="flex flex-wrap gap-2">
              {securityCommitments.map((item) => (
                <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">{item}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Certifications Roadmap</p>
            <div className="flex flex-wrap gap-2">
              {certificationRoadmap.map((item) => (
                <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">{item}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Corporate Information</p>
            <div className="space-y-1.5 text-xs text-white/45">
              <p>Lummy Technologies</p>
              <p>Registered Business Information</p>
              <p>Business Registration Number</p>
              <p>Registered Address</p>
              <p><a href="mailto:support@lummy.com" className="hover:text-white">support@lummy.com</a></p>
              <p><a href="mailto:privacy@lummy.com" className="hover:text-white">privacy@lummy.com</a></p>
              <p><a href="mailto:legal@lummy.com" className="hover:text-white">legal@lummy.com</a></p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-white/8" />

      {/* Bottom bar */}
      <div className="container py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs text-white/30">© 2025 Lummy Technologies. All rights reserved.</p>
            <p className="text-xs leading-5 text-white/30">
              Lummy provides global commerce, storefront, and payment enablement tools for independent creators and businesses.
              Feature availability may vary by country and payment provider. Users are responsible for complying with applicable
              local laws, tax obligations, and regulatory requirements.
            </p>
          </div>
          <p className="text-xs text-white/30">Built for creators everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
