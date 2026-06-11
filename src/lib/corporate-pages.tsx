import type { Metadata } from "next"
import Link from "next/link"
import { BRAND } from "@/config/branding"

export type CorporatePageKey =
  | "trust"
  | "security"
  | "compliance"
  | "privacy"
  | "terms"
  | "refunds"
  | "cookies"
  | "acceptable-use"
  | "status"
  | "community-guidelines"
  | "content-policy"
  | "intellectual-property"
  | "report-abuse"
  | "report-copyright"
  | "report-fraud"
  | "legal-payments"
  | "legal-merchant-terms"
  | "legal-platform-fees"
  | "legal-chargebacks"
  | "legal-prohibited-businesses"

type CorporatePage = {
  title: string
  description: string
  updated: string
  sections: Array<{ title: string; body: string[] }>
}

export const corporatePages: Record<CorporatePageKey, CorporatePage> = {
  trust: {
    title: "Trust Center",
    description: "How Lummy protects creator commerce, customer data, platform integrity, and responsible AI use.",
    updated: "June 5, 2026",
    sections: [
      { title: "Platform Commitments", body: ["Lummy provides commerce, storefront, and payment enablement tools for independent creators and businesses.", "We design core workflows around account protection, secure payments, auditability, and clear user controls."] },
      { title: "Trust & Safety", body: ["Users may report abuse, fraud, IP misuse, or unsafe content for review.", "Lummy may restrict storefronts, transactions, or accounts that violate platform policies or applicable law."] },
      { title: "Responsible AI", body: ["AI features are assistive tools. Creators remain responsible for reviewing generated content, prices, policies, and customer communications before use."] },
    ],
  },
  security: {
    title: "Security Practices",
    description: "Lummy's security commitments for account protection, data handling, access controls, and incident response.",
    updated: "June 5, 2026",
    sections: [
      { title: "Security Commitments", body: ["Lummy uses encryption in transit, database-backed access controls, role-aware organization membership, and secure authentication flows.", "Payment processing relies on supported payment providers and avoids storing raw card details in Lummy application code."] },
      { title: "Operational Controls", body: ["We maintain audit-oriented event logging, incident review processes, and least-privilege access practices as the platform scales."] },
      { title: "Vulnerability Disclosure", body: ["Security issues can be reported to security@lummy.com. Include affected URLs, reproduction steps, impact, and contact details for follow-up."] },
    ],
  },
  compliance: {
    title: "Compliance Center",
    description: "Compliance information for privacy, payments, creator commerce, and regional obligations.",
    updated: "June 5, 2026",
    sections: [
      { title: "Privacy Frameworks", body: ["Lummy supports GDPR, CCPA, and NDPA-aligned privacy operations as applicable to users and regions.", "Creators are responsible for their own customer notices, tax obligations, and regulated product obligations."] },
      { title: "Payment Compliance", body: ["Feature availability may vary by country and payment provider.", "Payment providers may require additional identity, business, tax, and risk verification before processing."] },
      { title: "Compliance Roadmap", body: ["SOC 2 Type I, SOC 2 Type II, ISO 27001, PCI-DSS alignment, and expanded regional privacy controls are tracked as roadmap certifications and attestations."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "How Lummy collects, uses, protects, and shares personal data.",
    updated: "June 5, 2026",
    sections: [
      { title: "Data We Process", body: ["We process account data, storefront data, transaction metadata, support communications, device/session data, and customer information creators submit through Lummy tools."] },
      { title: "How Data Is Used", body: ["Data is used to provide storefronts, commerce workflows, payments, analytics, support, safety review, and platform improvement."] },
      { title: "Your Rights", body: ["Depending on your location, you may request access, correction, deletion, portability, restriction, or objection. Contact privacy@lummy.com."] },
      { title: "Regional Notices", body: ["GDPR, CCPA, and NDPA rights are honored where applicable. We do not sell personal information as traditionally understood under CCPA."] },
    ],
  },
  terms: {
    title: "Terms of Service",
    description: "The terms governing access to and use of Lummy.",
    updated: "June 5, 2026",
    sections: [
      { title: "Using Lummy", body: ["You must provide accurate account information, keep credentials secure, and use Lummy only for lawful creator commerce activities."] },
      { title: "Creator Responsibility", body: ["Creators are responsible for products, services, fulfillment, taxes, customer support, refunds, and compliance with local laws."] },
      { title: "Platform Rights", body: ["Lummy may suspend, restrict, or remove access to protect users, payment partners, the platform, or legal compliance."] },
    ],
  },
  refunds: {
    title: "Refund & Cancellation Policy",
    description: "Refund and cancellation expectations for Lummy and creator transactions.",
    updated: "June 5, 2026",
    sections: [
      { title: "Creator Transactions", body: ["Creators set and communicate their customer refund terms unless applicable law or payment provider rules require otherwise."] },
      { title: "Platform Fees", body: ["Lummy platform fees may be non-refundable once services, payment processing, or commerce features have been used."] },
      { title: "Disputes", body: ["Customers and creators should first attempt resolution directly. Lummy may assist with platform records where appropriate."] },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    description: "How Lummy uses cookies and similar technologies.",
    updated: "June 5, 2026",
    sections: [
      { title: "Cookie Use", body: ["Lummy uses cookies for authentication, preferences, security, analytics, and platform performance."] },
      { title: "Choices", body: ["You can manage browser cookie settings. Some cookies are required for secure sign-in and commerce workflows."] },
    ],
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    description: "Rules for safe, lawful, and trustworthy use of Lummy.",
    updated: "June 5, 2026",
    sections: [
      { title: "Prohibited Conduct", body: ["Do not use Lummy for fraud, illegal goods, deceptive claims, harassment, malware, payment abuse, or rights-infringing content."] },
      { title: "Enforcement", body: ["Lummy may remove content, restrict storefronts, pause payment features, or terminate accounts when policy violations occur."] },
    ],
  },
  status: {
    title: "Platform Status",
    description: "Current operational status and incident reporting for Lummy services.",
    updated: "June 5, 2026",
    sections: [
      { title: "Current Status", body: ["Core storefront, dashboard, authentication, and payment enablement systems are monitored as part of platform operations."] },
      { title: "Incidents", body: ["Report service issues through support@lummy.com with timestamp, affected account, browser/device, and screenshots when possible."] },
    ],
  },
  "community-guidelines": {
    title: "Community Guidelines",
    description: "Standards for creators, customers, and community participation on Lummy.",
    updated: "June 5, 2026",
    sections: [{ title: "Community Standards", body: ["Be honest, lawful, respectful, and safe. Do not abuse customers, creators, platform tools, or payment workflows."] }],
  },
  "content-policy": {
    title: "Content Policy",
    description: "Rules for storefront, product, service, and AI-assisted content.",
    updated: "June 5, 2026",
    sections: [{ title: "Content Standards", body: ["Storefront content must not mislead customers, infringe rights, promote prohibited goods, or violate applicable law."] }],
  },
  "intellectual-property": {
    title: "Intellectual Property Policy",
    description: "How Lummy handles trademarks, copyright, and rights-holder concerns.",
    updated: "June 5, 2026",
    sections: [{ title: "Rights Protection", body: ["Creators must own or have permission to use uploaded content, brand names, product images, and marketing assets."] }],
  },
  "report-abuse": {
    title: "Report Abuse",
    description: "Report abuse, unsafe content, scams, or platform misuse.",
    updated: "June 5, 2026",
    sections: [{ title: "How To Report", body: ["Email support@lummy.com with the storefront URL, issue type, evidence, and your contact details."] }],
  },
  "report-copyright": {
    title: "DMCA & Copyright Reporting",
    description: "Report copyright concerns involving Lummy storefronts or content.",
    updated: "June 5, 2026",
    sections: [{ title: "Copyright Notices", body: ["Send copyright notices to legal@lummy.com with the work, infringing URL, ownership statement, and contact information."] }],
  },
  "report-fraud": {
    title: "Report Fraud",
    description: "Report suspected fraudulent storefronts, transactions, or payment abuse.",
    updated: "June 5, 2026",
    sections: [{ title: "Fraud Reports", body: ["Email support@lummy.com with payment references, storefront links, communications, and any supporting evidence."] }],
  },
  "legal-payments": {
    title: "Payments Policy",
    description: "Payment processing disclosures for Lummy creator commerce.",
    updated: "June 5, 2026",
    sections: [{ title: "Payment Enablement", body: ["Lummy enables payment workflows through third-party providers. Availability, settlement, refunds, and verification may vary by provider and country."] }],
  },
  "legal-merchant-terms": {
    title: "Merchant Terms",
    description: "Merchant responsibilities when selling through Lummy.",
    updated: "June 5, 2026",
    sections: [{ title: "Merchant Responsibility", body: ["Creators are merchants of record for their products or services unless otherwise agreed in writing."] }],
  },
  "legal-platform-fees": {
    title: "Platform Fees",
    description: "Lummy platform fee disclosures.",
    updated: "June 5, 2026",
    sections: [{ title: "Fees", body: ["Lummy may charge subscription, transaction, payment, or service fees. Any applicable fees should be reviewed before enabling paid features."] }],
  },
  "legal-chargebacks": {
    title: "Chargebacks & Disputes",
    description: "Chargeback, dispute, and payment reversal expectations.",
    updated: "June 5, 2026",
    sections: [{ title: "Disputes", body: ["Creators may be responsible for chargebacks, reversals, evidence submission, and provider dispute fees where applicable."] }],
  },
  "legal-prohibited-businesses": {
    title: "Prohibited Businesses",
    description: "Businesses and activities that may not use Lummy payment features.",
    updated: "June 5, 2026",
    sections: [{ title: "Restricted Activity", body: ["Illegal goods, fraud, regulated financial services, harmful products, infringement, adult exploitation, and other high-risk categories may be prohibited or require review."] }],
  },
}

export function pageMetadata(key: CorporatePageKey, path: string): Metadata {
  const page = corporatePages[key]
  return {
    title: `${page.title} | ${BRAND.name}`,
    description: page.description,
    alternates: { canonical: `https://lummy.co${path}` },
    openGraph: { title: `${page.title} | ${BRAND.name}`, description: page.description, url: `https://lummy.co${path}`, siteName: BRAND.name, type: "website" },
  }
}

export function CorporatePageView({ pageKey }: { pageKey: CorporatePageKey }) {
  const page = corporatePages[pageKey]
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-muted/20">
        <div className="container py-16 sm:py-20">
          <Link href="/" className="text-xs font-semibold text-brand-purple hover:underline">{BRAND.name}</Link>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-normal sm:text-5xl">{page.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{page.description}</p>
          <p className="mt-5 text-xs text-muted-foreground">Last updated: {page.updated}</p>
        </div>
      </section>
      <section className="container py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            {page.sections.map((section) => (
              <article key={section.title} className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display text-xl font-bold">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((body) => <p key={body} className="text-sm leading-6 text-muted-foreground">{body}</p>)}
                </div>
              </article>
            ))}
          </div>
          <aside className="h-fit rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-bold">Corporate Contacts</h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>Lummy Technologies Ltd.</p>
              <p>Support: <a className="text-brand-purple hover:underline" href="mailto:support@lummy.com">support@lummy.com</a></p>
              <p>Privacy: <a className="text-brand-purple hover:underline" href="mailto:privacy@lummy.com">privacy@lummy.com</a></p>
              <p>Legal: <a className="text-brand-purple hover:underline" href="mailto:legal@lummy.com">legal@lummy.com</a></p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
