"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Share2, Copy, CheckCheck, MessageCircle, X,
  Instagram, ExternalLink, Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { getShareableStorefront, recordStorefrontShare } from "@/server/actions/storefront-share"

export function ShareStorePanel() {
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [copiedHandle, setCopiedHandle] = React.useState(false)
  const [store, setStore] = React.useState<{ handle: string; storeName: string; storeUrl: string; whatsAppShareLink: string } | null>(null)
  const [loadError, setLoadError] = React.useState(false)

  React.useEffect(() => {
    if (!open || store || loadError) return
    getShareableStorefront()
      .then(setStore)
      .catch(() => setLoadError(true))
  }, [open, store, loadError])

  const storeUrl = store?.storeUrl ?? ""
  const storeUrlDisplay = storeUrl.replace(/^https?:\/\//, "")

  const copyLink = () => {
    if (!storeUrl) return
    navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    toast({ title: "Store link copied!", variant: "success" })
    void recordStorefrontShare("copy_link").catch(() => {})
    setTimeout(() => setCopied(false), 2500)
  }

  const copyHandle = () => {
    if (!storeUrlDisplay) return
    navigator.clipboard.writeText(storeUrlDisplay)
    setCopiedHandle(true)
    setTimeout(() => setCopiedHandle(false), 2500)
  }

  const handleWhatsAppShare = () => {
    void recordStorefrontShare("whatsapp").catch(() => {})
  }

  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share Store
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-card overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div>
                  <h2 className="font-display text-lg font-extrabold">Share your store</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Let the world know you&apos;re open for business</p>
                </div>
                <button onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Store URL display */}
                <div className="rounded-2xl bg-gradient-to-br from-brand-purple/10 to-brand-indigo/10 border border-brand-purple/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-purple mb-2">Your store link</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Link2 className="h-3.5 w-3.5 text-brand-purple flex-shrink-0" />
                      <span className="text-sm font-semibold truncate">{loadError ? "Unable to load store link" : storeUrlDisplay || "Loading…"}</span>
                    </div>
                    <button onClick={copyHandle} disabled={!storeUrlDisplay}
                      className={cn(
                        "flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 disabled:opacity-50",
                        copiedHandle ? "bg-brand-green/10 text-brand-green" : "bg-brand-purple text-white hover:bg-brand-purple/90"
                      )}>
                      {copiedHandle ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedHandle ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Share channels */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Share on</p>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Copy full link */}
                    <button onClick={copyLink} disabled={!storeUrl}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all disabled:opacity-50",
                        copied ? "border-brand-green/30 bg-brand-green/5" : "border-border hover:border-brand-purple/20 hover:bg-accent/50"
                      )}>
                      {copied
                        ? <CheckCheck className="h-4 w-4 text-brand-green flex-shrink-0" />
                        : <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <div>
                        <p className="text-xs font-semibold">{copied ? "Copied to clipboard!" : "Copy full link"}</p>
                        <p className="text-[10px] text-muted-foreground">{storeUrl || "Loading…"}</p>
                      </div>
                    </button>

                    {/* WhatsApp */}
                    <a href={store?.whatsAppShareLink ?? "#"} target="_blank" rel="noopener noreferrer" onClick={handleWhatsAppShare}
                      aria-disabled={!store}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-colors",
                        !store && "pointer-events-none opacity-50"
                      )}>
                      <MessageCircle className="h-4 w-4 text-[#25D366] fill-[#25D366]/20 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-[#25D366]">Share on WhatsApp</p>
                        <p className="text-[10px] text-muted-foreground">Send to contacts or broadcast list</p>
                      </div>
                    </a>

                    {/* Instagram bio */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-pink-500/20 bg-pink-500/5">
                      <Instagram className="h-4 w-4 text-pink-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-pink-500">Instagram bio link</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Go to Edit Profile → Website and paste your store link
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Tip: Add your link to WhatsApp status, TikTok bio, and Twitter profile for maximum reach 🚀
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
