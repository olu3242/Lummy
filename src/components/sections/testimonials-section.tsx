"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { mockTestimonials } from "@/data/mock"

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial }: { testimonial: (typeof mockTestimonials)[0] }) {
  return (
    <div className="relative flex-shrink-0 w-72 rounded-3xl border border-border bg-card p-5 flex flex-col gap-3 mx-2 hover:shadow-brand-sm hover:-translate-y-0.5 transition-all duration-300">
      <Quote className="h-5 w-5 text-brand-purple/25 absolute top-4 right-4" />
      <StarRow count={testimonial.rating} />
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
        &ldquo;{testimonial.content}&rdquo;
      </p>
      <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-2xl bg-brand-purple/5 border border-brand-purple/10">
        <div>
          <p className="font-display text-lg font-extrabold gradient-text">{testimonial.metric}</p>
          <p className="text-[10px] text-muted-foreground">{testimonial.metricLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-brand-purple/20">
          <Image src={testimonial.avatar} alt={testimonial.name} fill className="object-cover" unoptimized />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{testimonial.name}</p>
          <p className="text-[11px] text-brand-purple/70">{testimonial.handle}</p>
        </div>
      </div>
    </div>
  )
}

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const doubled = [...mockTestimonials, ...mockTestimonials]
  return (
    <div className="overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      <motion.div
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex"
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.id}-${i}`} testimonial={t} />
        ))}
      </motion.div>
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="section-padding bg-background overflow-hidden">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Creator stories</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Before and after.<br />
            <span className="gradient-text">Creator growth stories.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Creators use Lummy to move from scattered messages and manual selling into a clearer, more trusted buying experience.
          </p>
        </motion.div>
      </div>

      {/* Marquee rows — full bleed outside container */}
      <div className="space-y-4 py-2">
        <MarqueeRow />
        <MarqueeRow reverse />
      </div>

      {/* Trust logos */}
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-14 pt-10 border-t border-border"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">Built for credibility across</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-30">
            {["Creators", "Small Businesses", "Digital Sellers", "Service Providers", "Independent Brands"].map(name => (
              <span key={name} className="font-display font-bold text-sm text-foreground">{name}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
