import Link from "next/link"
import Image from "next/image"
import { Twitter, Instagram, Linkedin, Youtube } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { BRAND } from "@/config/branding"

const footerLinks = {
  Company: [
    { label: `About ${BRAND.name}`, href: "/#features" },
    { label: `How ${BRAND.name} Works`, href: "/#how-it-works" },
    { label: "Careers", href: "/careers" },
    { label: "Press & Media", href: "/press" },
    { label: "Brand Assets", href: "/brand-assets" },
    { label: "Partner Program", href: "/partner-program" },
    { label: "Affiliate Program", href: "/affiliate-program" },
    { label: "Contact Us", href: "mailto:support@lummy.com" },
  ],
  Creators: [
    { label: "Create a Storefront", href: "/signup" },
    { label: "Discover Creators", href: "/discover" },
    { label: "Sell Products", href: "/#features" },
    { label: "Sell Services", href: "/#features" },
    { label: "Creator Resources", href: "/community-guidelines" },
    { label: "Pricing", href: "/pricing" },
    { label: "Success Stories", href: "/#testimonials" },
    { label: "Help Center", href: "/dashboard/help" },
  ],
  Support: [
    { label: "Knowledge Base", href: "/dashboard/help" },
    { label: "Community", href: "/community-guidelines" },
    { label: "System Status", href: "/status" },
    { label: "Report an Issue", href: "/report-abuse" },
    { label: "Account Recovery", href: "mailto:support@lummy.com" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  Trust: [
    { label: "Security", href: "/security" },
    { label: "Trust Center", href: "/trust" },
    { label: "Platform Status", href: "/status" },
    { label: "Compliance Center", href: "/compliance" },
    { label: "Data Protection", href: "/privacy" },
    { label: "Responsible AI Use", href: "/trust" },
    { label: "Incident Reporting", href: "/report-abuse" },
    { label: "Vulnerability Disclosure", href: "/security" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Acceptable Use Policy", href: "/acceptable-use" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Data Processing Addendum", href: "/compliance" },
    { label: "Refund & Cancellation Policy", href: "/refunds" },
    { label: "Intellectual Property Policy", href: "/intellectual-property" },
    { label: "DMCA & Copyright Policy", href: "/report-copyright" },
    { label: "Payments Policy", href: "/legal/payments" },
    { label: "Merchant Terms", href: "/legal/merchant-terms" },
    { label: "Platform Fees", href: "/legal/platform-fees" },
    { label: "Chargebacks", href: "/legal/chargebacks" },
    { label: "Prohibited Businesses", href: "/legal/prohibited-businesses" },
  ],
  Compliance: [
    { label: "GDPR Compliance", href: "/compliance" },
    { label: "CCPA Privacy Notice", href: "/privacy" },
    { label: "Cookie Preferences", href: "/cookies" },
    { label: "Trust & Safety", href: "/trust" },
    { label: "Security Practices", href: "/security" },
    { label: "Law Enforcement Requests", href: "mailto:legal@lummy.com" },
  ],
  Marketplace: [
    { label: "Discover Stores", href: "/discover" },
    { label: "Community Guidelines", href: "/community-guidelines" },
    { label: "Content Policy", href: "/content-policy" },
    { label: "Report Abuse", href: "/report-abuse" },
    { label: "Report Copyright", href: "/report-copyright" },
    { label: "Report Fraud", href: "/report-fraud" },
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
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5 xl:grid-cols-8">
          {/* Brand col */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <Image src={BRAND.logo} alt={BRAND.name} width={32} height={32} className="h-8 w-8 rounded-xl" />
              <span className="font-display text-xl font-bold text-white">{BRAND.name}</span>
            </Link>
            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
              {BRAND.name} provides commerce, storefront, and payment enablement tools for independent creators and businesses.
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
              <p>Lummy Technologies Ltd.</p>
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
            <p className="text-xs text-white/30">© 2025 Lummy Technologies Ltd. All Rights Reserved.</p>
            <p className="text-xs leading-5 text-white/30">
              Lummy provides commerce, storefront, and payment enablement tools for independent creators and businesses.
              Availability of features may vary by country and payment provider. Users are responsible for complying with
              applicable local laws, tax obligations, and regulatory requirements.
            </p>
          </div>
          <p className="text-xs text-white/30">Built for creator commerce.</p>
        </div>
      </div>
    </footer>
  )
}
