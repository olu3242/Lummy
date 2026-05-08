"use client"

import { motion } from "framer-motion"
import {
  Store,
  MessageCircle,
  BarChart3,
  Users,
  Sparkles,
  CreditCard,
  Share2,
  Wallet,
  Bot,
  ShieldCheck,
} from "lucide-react"

const features = [
  {
    icon: Store,
    title: "Creator Storefronts",
    description: "A beautiful, mobile-first store at your own URL. Products, services, and digital goods in one place.",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    border: "border-brand-purple/20",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Commerce",
    description: "Turn every DM into a sale. Auto-generated WhatsApp order flows that convert followers to buyers.",
    color: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
    border: "border-[#25D366]/20",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Real-time data on clicks, views, conversions, top products, and campaign performance.",
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
    border: "border-brand-coral/20",
  },
  {
    icon: Users,
    title: "CRM Lite",
    description: "Customer profiles, order history, smart segmentation, and follow-up reminders.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: Sparkles,
    title: "AI Growth Assistant",
    description: "Claude-powered AI that writes your captions, CTAs, product descriptions, and reply templates.",
    color: "text-brand-indigo",
    bg: "bg-brand-indigo/10",
    border: "border-brand-indigo/20",
  },
  {
    icon: CreditCard,
    title: "Paystack Payments",
    description: "Cards, bank transfer, USSD, and mobile money. Payouts in 24 hours. No setup fees.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  {
    icon: Share2,
    title: "Sellable Posts",
    description: "Tag any post with a product. Your content becomes a shoppable storefront experience.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "border-pink-400/20",
  },
  {
    icon: Wallet,
    title: "Instant Payouts",
    description: "Money goes straight to your bank account within 24 hours. No holding periods.",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
  },
  {
    icon: Bot,
    title: "AI Campaigns",
    description: "Generate complete campaign strategies, timing recommendations, and copy in seconds.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Compliant",
    description: "PCI-DSS compliant payments. NDPR-ready data handling. Enterprise-grade security.",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    border: "border-teal-400/20",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

export function FeatureStripSection() {
  return (
    <section id="features" className="section-padding bg-background">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Everything you need
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            One OS for your entire
            <br />
            <span className="gradient-text">creator business.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Stop juggling 10 tools. Lummy brings storefronts, payments, WhatsApp commerce, CRM, and AI into a single, beautifully simple platform.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                variants={itemVariants}
                className={`group relative rounded-2xl border ${feat.border} bg-card p-5 hover:shadow-brand-sm transition-all duration-300 hover:-translate-y-1 cursor-default`}
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${feat.bg} ${feat.border} border mb-4`}>
                  <Icon className={`h-5 w-5 ${feat.color}`} />
                </div>
                <h3 className="font-display text-sm font-bold mb-2 leading-snug">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
