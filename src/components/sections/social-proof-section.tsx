"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, ShieldCheck, LockKeyhole, CreditCard, Server } from "lucide-react"

const outcomes = [
  { value: "3x", label: "more repeat buyers", detail: "Creators turn scattered conversations into reliable follow-up." },
  { value: "Hours", label: "to launch", detail: "Go from idea to a shareable storefront without a technical setup." },
  { value: "1 place", label: "to run sales", detail: "Products, orders, customers, and growth tools stay together." },
]

const trust = [
  { icon: CreditCard, label: "Secure payments" },
  { icon: LockKeyhole, label: "Privacy protected" },
  { icon: ShieldCheck, label: "Trusted by creators" },
  { icon: Server, label: "Reliable infrastructure" },
]

export function SocialProofSection() {
  return (
    <section className="bg-background py-14 sm:py-16 border-b border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Built for creator growth</p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Start with a storefront.
              <span className="gradient-text"> Grow into a real business.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
              Lummy helps creators look credible, sell anywhere, and keep customers coming back without stitching together multiple tools.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {trust.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3">
                  <Icon className="h-4 w-4 text-brand-purple" />
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {outcomes.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <p className="font-display text-3xl font-extrabold gradient-text">{item.value}</p>
              <p className="mt-1 text-sm font-bold">{item.label}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Create your storefront <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
