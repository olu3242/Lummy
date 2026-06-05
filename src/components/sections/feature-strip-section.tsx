"use client"

import { motion } from "framer-motion"
import {
  Store,
  Globe2,
  ClipboardList,
  Users,
  Lightbulb,
  CreditCard,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: Store,
    title: "Professional Presence",
    description: "Look credible from day one with a storefront that makes your brand feel ready to buy from.",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    border: "border-brand-purple/20",
  },
  {
    icon: Globe2,
    title: "Sell Anywhere",
    description: "Share your store across Instagram, TikTok, WhatsApp, email, or anywhere your audience already finds you.",
    color: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
    border: "border-[#25D366]/20",
  },
  {
    icon: CreditCard,
    title: "Get Paid Faster",
    description: "Make buying simple and secure so interested customers can move from intent to payment quickly.",
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
    border: "border-brand-coral/20",
  },
  {
    icon: ClipboardList,
    title: "Stay Organized",
    description: "Manage products, orders, and customers in one place instead of bouncing between scattered tools.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: Lightbulb,
    title: "Grow with Confidence",
    description: "Use intelligent recommendations to improve offers, communicate clearly, and make better business decisions.",
    color: "text-brand-indigo",
    bg: "bg-brand-indigo/10",
    border: "border-brand-indigo/20",
  },
  {
    icon: ShieldCheck,
    title: "Build Trust",
    description: "Give buyers a safer, more polished purchase experience that reflects well on your business.",
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
            Benefits
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            More than a link.
            <br />
            <span className="gradient-text">A better way to sell.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Lummy gives creators the confidence, clarity, and simple tools needed to turn interest into real sales.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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

        <div className="mt-10 text-center">
          <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-purple px-5 py-3 text-sm font-bold text-white hover:bg-brand-purple/90 transition-colors">
            Start selling today <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
