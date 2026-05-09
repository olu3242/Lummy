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

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof mockTestimonials)[0]
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative rounded-3xl border border-border bg-card p-6 flex flex-col gap-4 hover:shadow-brand-sm transition-all duration-300 hover:-translate-y-1"
    >
      {/* Quote icon */}
      <Quote className="h-6 w-6 text-brand-purple/30 absolute top-5 right-5" />

      {/* Stars */}
      <StarRow count={testimonial.rating} />

      {/* Content */}
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        &ldquo;{testimonial.content}&rdquo;
      </p>

      {/* Metric highlight */}
      <div className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-brand-purple/5 border border-brand-purple/10">
        <div>
          <p className="font-display text-xl font-extrabold gradient-text">{testimonial.metric}</p>
          <p className="text-xs text-muted-foreground">{testimonial.metricLabel}</p>
        </div>
      </div>

      {/* Creator info */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-brand-purple/20">
          <Image
            src={testimonial.avatar}
            alt={testimonial.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div>
          <p className="text-sm font-semibold">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">{testimonial.niche}</p>
          <p className="text-xs text-brand-purple/70">{testimonial.handle}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="section-padding bg-background">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Creator stories
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Real creators.
            <br />
            <span className="gradient-text">Real results.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Thousands of African creators use Lummy to build businesses that earn while they sleep. Here&apos;s what they say.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {mockTestimonials.map((testimonial, i) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={i} />
          ))}
        </div>

        {/* Trust logos / press */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 pt-12 border-t border-border"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            As seen on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-30">
            {["TechCabal", "Techpoint", "BusinessDay NG", "Nairametrics", "The Guardian"].map((name) => (
              <span key={name} className="font-display font-bold text-sm text-foreground">
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
