"use client"

import {
  Megaphone, Sparkles, User, ShoppingBag, Star,
  MessageSquare, Image, MessageCircle, HelpCircle, Link2,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { SectionType } from "../schema/types"

interface SectionOption {
  type: SectionType
  label: string
  description: string
  Icon: React.ElementType
}

const SECTION_OPTIONS: SectionOption[] = [
  { type: "Hero", label: "Hero Banner", description: "Headline, subtext and CTA button", Icon: Sparkles },
  { type: "CreatorBio", label: "Creator Bio", description: "Profile, stats, socials and WhatsApp CTA", Icon: User },
  { type: "AnnouncementBar", label: "Announcement Bar", description: "Sticky promo banner at the top", Icon: Megaphone },
  { type: "ProductGrid", label: "Product Grid", description: "Searchable, filterable product catalog", Icon: ShoppingBag },
  { type: "FeaturedCollection", label: "Featured Collection", description: "Highlight your best-selling items", Icon: Star },
  { type: "Testimonials", label: "Reviews", description: "Customer testimonials and ratings", Icon: MessageSquare },
  { type: "Gallery", label: "Gallery", description: "Image mosaic from your products", Icon: Image },
  { type: "CTA", label: "WhatsApp CTA", description: "Full-width call-to-action block", Icon: MessageCircle },
  { type: "FAQ", label: "FAQ", description: "Accordion with common questions", Icon: HelpCircle },
  { type: "SocialLinks", label: "Social Links", description: "Instagram, Twitter, TikTok links", Icon: Link2 },
]

interface SectionAddDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (type: SectionType) => void
}

export function SectionAddDialog({ open, onClose, onAdd }: SectionAddDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-[480px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-semibold text-sm">Add Section</p>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {SECTION_OPTIONS.map(opt => {
                const Icon = opt.Icon
                return (
                  <button
                    key={opt.type}
                    onClick={() => { onAdd(opt.type); onClose() }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-foreground/20 hover:bg-accent/50 transition-all text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-background transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
