"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { BadgeCheck, TrendingUp, ShoppingBag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { mockCreators } from "@/data/mock"

function CreatorCard({ creator, index }: { creator: (typeof mockCreators)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card hover:-translate-y-2 transition-all duration-300 hover:shadow-brand"
    >
      {/* Cover image */}
      <div className="relative h-40 overflow-hidden">
        <Image
          src={creator.cover}
          alt={creator.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Revenue badge */}
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold">
            <TrendingUp className="w-2.5 h-2.5 text-brand-green" />
            {creator.revenue}
          </span>
        </div>

        {/* Niche */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="glass" size="sm">{creator.niche}</Badge>
        </div>
      </div>

      {/* Creator info */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-brand-purple/20">
            <Image src={creator.avatar} alt={creator.name} fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-display font-bold text-sm truncate">{creator.name}</p>
              {creator.verified && (
                <BadgeCheck className="w-3.5 h-3.5 text-brand-purple flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{creator.handle}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{creator.location}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {creator.bio}
        </p>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{creator.followers}</span>
            <span>followers</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShoppingBag className="w-3 h-3" />
            <span className="font-semibold text-foreground">{creator.products}</span>
            <span>products</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function CreatorGallerySection() {
  return (
    <section id="gallery" className="section-padding bg-muted/30">
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
            Creator community
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Built by creators,
            <br />
            <span className="gradient-text">for creators.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto">
            From fashion to food, music to modest wear — African creators of every niche are building real businesses on Lummy.
          </p>
        </motion.div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockCreators.map((creator, i) => (
            <CreatorCard key={creator.id} creator={creator} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Join 2,000+ African creators already selling on Lummy →{" "}
            <button className="text-primary font-semibold hover:underline">
              Start your store today
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
