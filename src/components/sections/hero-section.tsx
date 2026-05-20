"use client"

import * as React from "react"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import {
  MessageCircle,
  TrendingUp,
  ShoppingBag,
  Star,
  CheckCircle2,
  ArrowRight,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockHeroAvatars, mockStats } from "@/data/mock"
import { images } from "@/config/images"
import Link from "next/link"

// Animated number counter
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [display, setDisplay] = React.useState("0")

  React.useEffect(() => {
    if (!isInView) return
    // Extract numeric part and suffix
    const match = value.match(/^([₦]?)(\d[\d,.]*)([\w+%★\s]*)$/)
    if (!match) { setDisplay(value); return }
    const [, prefix, numStr, suffix] = match
    const target = parseFloat(numStr.replace(/,/g, ""))
    const isDecimal = numStr.includes(".")
    const start = 0
    const duration = 1800
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (target - start) * eased
      setDisplay(`${prefix}${isDecimal ? current.toFixed(1) : Math.round(current).toLocaleString()}${suffix}`)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, value])

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-2xl sm:text-3xl font-bold text-white">{display}</p>
      <p className="mt-1 text-sm text-white/40">{label}</p>
    </div>
  )
}

// Scrolling creator marquee
const MARQUEE_CREATORS = [
  "Sade's Boutique 🛍️", "Chioma Beauty 💄", "Amaka Crafts ✂️",
  "Kemi Kitchen 🍲", "Zara Styles 👗", "Nkem Jewels 💎",
  "Ada's Prints 🎨", "Funmi Skincare 🌿", "Blessing Wigs 👑",
  "Temi Home Décor 🏠", "Grace Footwear 👠", "Yemi Organics 🌱",
]

function CreatorMarquee() {
  const doubled = [...MARQUEE_CREATORS, ...MARQUEE_CREATORS]
  return (
    <div className="overflow-hidden py-3 border-t border-white/10 mt-6">
      <motion.div
        className="flex gap-6 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((name, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-xs text-white/50 font-medium flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple/60 flex-shrink-0" />
            {name}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay },
})

function FloatingCard({
  className,
  children,
  delay = 0,
}: {
  className?: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      style={{ animationDelay: `${delay}s` }}
      className={`absolute glass-card rounded-2xl p-3 shadow-glass-dark ${className}`}
    >
      {children}
    </motion.div>
  )
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      {/* Glow beneath phone */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-brand-purple/40 blur-[60px] rounded-full" />

      {/* Phone outer frame */}
      <div className="relative z-10 rounded-[44px] bg-[#1a1a2e] p-[10px] shadow-[0_40px_100px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/10">
        {/* Screen */}
        <div className="rounded-[36px] overflow-hidden bg-[#0d0d1a] min-h-[560px] relative">
          {/* Status bar + notch */}
          <div className="flex items-start justify-between px-5 pt-3 pb-1">
            <span className="text-white/40 text-[9px] font-medium">9:41</span>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-6 bg-[#0d0d1a] rounded-b-3xl" />
            <span className="text-white/40 text-[9px] font-medium">●●●</span>
          </div>

          {/* App header */}
          <div className="px-4 pb-3 flex items-center justify-between border-b border-white/5">
            <span className="text-white text-[11px] font-semibold tracking-tight">Sade&apos;s Store</span>
            <span className="flex items-center gap-1 text-brand-green text-[9px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Live
            </span>
          </div>

          {/* Creator profile area */}
          <div className="flex flex-col items-center px-4 py-4 border-b border-white/5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-brand-purple/60 ring-offset-2 ring-offset-[#0d0d1a]">
              <Image
                src={images.creators.sade}
                alt="Creator"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="text-white text-[11px] font-semibold mt-2">Sade Okoye</p>
            <p className="text-white/40 text-[9px]">Fashion & Beauty · Lagos</p>
            <div className="flex gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-brand-purple/15 border border-brand-purple/20 text-brand-purple text-[8px] font-medium">
                45.2k followers
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[8px] font-medium">
                Fashion
              </span>
            </div>
          </div>

          {/* Products list */}
          <div className="px-3 py-3 space-y-2">
            <p className="text-white/40 text-[9px] font-semibold uppercase tracking-wider px-1">
              Products
            </p>
            {[
              { name: "Ankara Print Dress", price: "₦25,000", img: images.products.dress },
              { name: "Beaded Necklace Set", price: "₦8,500", img: images.products.necklace },
              { name: "Leather Mini Bag", price: "₦18,000", img: images.products.bag },
            ].map((product) => (
              <div
                key={product.name}
                className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/6 p-2"
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={product.img}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[9px] font-semibold truncate">{product.name}</p>
                  <p className="text-brand-purple text-[9px] font-bold">{product.price}</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-brand-purple/20 flex items-center justify-center">
                  <ShoppingBag className="w-2.5 h-2.5 text-brand-purple" />
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <div className="absolute bottom-4 left-3 right-3">
            <div className="w-full bg-[#25D366] rounded-2xl py-2.5 flex items-center justify-center gap-1.5">
              <MessageCircle className="w-3 h-3 text-white fill-white" />
              <span className="text-white text-[10px] font-semibold">Order via WhatsApp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating analytics cards */}
      <FloatingCard className="-left-16 sm:-left-20 top-16" delay={0.8}>
        <div className="flex items-center gap-2 min-w-[130px]">
          <div className="w-8 h-8 rounded-xl bg-brand-green/15 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-brand-green" />
          </div>
          <div>
            <p className="text-white text-xs font-bold leading-none">₦847k</p>
            <p className="text-white/40 text-[9px] mt-0.5">Revenue this month</p>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard className="-right-12 sm:-right-16 top-32" delay={1.0}>
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="w-8 h-8 rounded-xl bg-brand-purple/15 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-4 h-4 text-brand-purple" />
          </div>
          <div>
            <p className="text-white text-xs font-bold leading-none">1,234</p>
            <p className="text-white/40 text-[9px] mt-0.5">Orders total</p>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard className="-right-10 sm:-right-14 bottom-32" delay={1.2}>
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          <div>
            <p className="text-white text-xs font-bold leading-none">4.9 ★</p>
            <p className="text-white/40 text-[9px] mt-0.5">Store rating</p>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard className="-left-14 sm:-left-18 bottom-40" delay={1.1}>
        <div className="flex items-center gap-2 min-w-[110px]">
          <div className="w-6 h-6 rounded-full bg-brand-coral/15 flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-brand-coral" />
          </div>
          <div>
            <p className="text-brand-green text-xs font-bold leading-none">+28%</p>
            <p className="text-white/40 text-[9px] mt-0.5">This week</p>
          </div>
        </div>
      </FloatingCard>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-brand-midnight overflow-hidden flex items-center">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-purple/15 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-indigo/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-3/4 left-1/2 w-[300px] h-[300px] bg-brand-coral/8 rounded-full blur-[100px]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 container pt-32 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-16 xl:gap-24">
          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            {/* Launch badge */}
            <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 mb-6">
              <Badge variant="brand-glow" size="lg" className="cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse" />
                Creator Commerce OS for Africa
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.2)}
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] tracking-tight"
            >
              Turn Followers
              <br />
              <span className="gradient-text">Into Customers.</span>
            </motion.h1>

            {/* Sub-tagline */}
            <motion.p
              {...fadeUp(0.3)}
              className="mt-4 text-xl sm:text-2xl font-semibold text-white/50 tracking-tight"
            >
              Post. Chat. Get Paid.
            </motion.p>

            {/* Description */}
            <motion.p
              {...fadeUp(0.4)}
              className="mt-6 text-base sm:text-lg text-white/40 leading-relaxed max-w-lg mx-auto lg:mx-0"
            >
              Lummy is the creator commerce platform built for Africa. Open a storefront, sell via WhatsApp, and grow with AI — without touching a line of code.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(0.5)}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <Button size="xl" className="group" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline-white" size="xl" className="group" asChild>
                <Link href="#workflow">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 group-hover:bg-white/25 transition-colors">
                    <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                  </div>
                  See How It Works
                </Link>
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              {...fadeUp(0.6)}
              className="mt-6 flex items-center gap-4 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-1 text-white/30 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                No credit card required
              </div>
              <div className="flex items-center gap-1 text-white/30 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                Free forever plan
              </div>
            </motion.div>

            {/* Social proof avatars */}
            <motion.div
              {...fadeUp(0.7)}
              className="mt-8 flex items-center gap-3 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2.5">
                {mockHeroAvatars.map((src, i) => (
                  <div
                    key={i}
                    className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-brand-midnight ring-1 ring-brand-purple/20"
                    style={{ zIndex: mockHeroAvatars.length - i }}
                  >
                    <Image src={src} alt="Creator" fill className="object-cover" unoptimized />
                  </div>
                ))}
                <div className="relative w-8 h-8 rounded-full bg-brand-purple/20 border-2 border-brand-midnight flex items-center justify-center text-[8px] font-bold text-brand-purple">
                  2k+
                </div>
              </div>
              <p className="text-sm text-white/50">
                <span className="text-white font-semibold">2,000+ creators</span> already selling
              </p>
            </motion.div>
          </div>

          {/* Right: Phone */}
          <motion.div
            className="flex-1 flex justify-center order-1 lg:order-2"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          >
            <PhoneMockup />
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-24 pt-12 border-t border-white/8"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {mockStats.map((stat) => (
              <AnimatedStat key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
          <CreatorMarquee />
        </motion.div>
      </div>
    </section>
  )
}
