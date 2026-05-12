"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Zap, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function LiveCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const duration = 1800
    const raf = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.floor(eased * target))
      if (t < 1) requestAnimationFrame(raf)
      else setValue(target)
    }
    requestAnimationFrame(raf)
  }, [inView, target])

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>
}

export function CTASection() {
  return (
    <section className="py-24 bg-brand-midnight relative overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[400px] bg-brand-purple/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[300px] bg-brand-indigo/15 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>

      <div className="relative container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Pulsing icon */}
          <div className="relative inline-flex mb-8">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-2xl bg-brand-purple/30 blur-lg"
            />
            <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-indigo shadow-brand-lg">
              <Zap className="h-8 w-8 text-white fill-white" />
            </div>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
            Start selling today.
            <br />
            <span className="gradient-text">Your store is waiting.</span>
          </h2>

          <p className="mt-6 text-xl text-white/50 leading-relaxed max-w-xl mx-auto">
            Join 2,000+ African creators who are building real income from their audiences. Set up your store in minutes — no code, no stress.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="xl" variant="glow" className="group">
                Create Your Free Store
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="xl" variant="outline-white">
              <MessageCircle className="h-5 w-5" />
              Talk to the Team
            </Button>
          </div>

          <p className="mt-6 text-sm text-white/30">Free forever · No credit card · Setup in 5 minutes</p>

          {/* Animated stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8"
          >
            {[
              { value: 500, suffix: "M+", prefix: "₦", label: "Revenue processed" },
              { value: 2000, suffix: "+",  prefix: "",  label: "Active creators"   },
              { value: 49,   suffix: "★",  prefix: "4.", label: "Average rating"   },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-2xl font-extrabold text-white">
                  {stat.prefix}<LiveCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Live activity pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-white/60"
          >
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="font-semibold text-white">47</span> creators opened stores in the last 24 hours
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
