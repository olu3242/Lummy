"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Share2, Copy, CheckCheck, MessageCircle, X,
  Instagram, ExternalLink, QrCode, Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export function ShareStorePanel() {
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [copiedHandle, setCopiedHandle] = React.useState(false)
  const [storeUrl, setStoreUrl] = React.useState("lummy.co/")
  const fullUrl = `https://${storeUrl}`
  const waText = encodeURIComponent(
    `Hey! Check out my store on Lummy.\n\nShop here: ${fullUrl}`
  )

  React.useEffect(() => {
    fetch("/api/account/config")
      .then(async (res) => {
        const payload = await res.json() as { storefront?: { handle?: string | null } | null }
        if (!res.ok) throw new Error("Failed to load storefront")
        return payload
      })
      .then((payload) => {
        if (payload.storefront?.handle) setStoreUrl(`lummy.co/${payload.storefront.handle}`)
      })
      .catch(() => {})
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast({ title: "Store link copied!", variant: "success" })
    setTimeout(() => setCopied(false), 2500)
  }

  const copyHandle = () => {
    navigator.clipboard.writeText(storeUrl)
    setCopiedHandle(true)
    setTimeout(() => setCopiedHandle(false), 2500)
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
                      <span className="text-sm font-semibold truncate">{storeUrl}</span>
                    </div>
                    <button onClick={copyHandle}
                      className={cn(
                        "flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0",
                        copiedHandle ? "bg-brand-green/10 text-brand-green" : "bg-brand-purple text-white hover:bg-brand-purple/90"
                      )}>
                      {copiedHandle ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedHandle ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* QR placeholder */}
                <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-border bg-muted/30">
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center flex-shrink-0">
                    <QrCode className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">Store QR code</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      Customers scan to open your store instantly — no link needed.
                    </p>
                    <button className="mt-1.5 text-[11px] font-semibold text-brand-purple hover:underline">
                      Download QR →
                    </button>
                  </div>
                </div>

                {/* Share channels */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Share on</p>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Copy full link */}
                    <button onClick={copyLink}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        copied ? "border-brand-green/30 bg-brand-green/5" : "border-border hover:border-brand-purple/20 hover:bg-accent/50"
                      )}>
                      {copied
                        ? <CheckCheck className="h-4 w-4 text-brand-green flex-shrink-0" />
                        : <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <div>
                        <p className="text-xs font-semibold">{copied ? "Copied to clipboard!" : "Copy full link"}</p>
                        <p className="text-[10px] text-muted-foreground">https://{storeUrl}</p>
                      </div>
                    </button>

                    {/* WhatsApp */}
                    <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-colors">
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
