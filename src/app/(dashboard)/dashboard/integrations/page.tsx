"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap, CheckCircle2, AlertCircle, Plus, X, Eye, EyeOff,
  Copy, CheckCheck, ExternalLink, RefreshCw, Trash2,
  CreditCard, Truck, Share2, Code2, Webhook, Key,
  Instagram, Twitter, ShieldCheck, Globe, MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

type IntegrationStatus = "connected" | "disconnected" | "coming_soon"
type IntegrationCategory = "payments" | "logistics" | "social" | "developer"

interface Integration {
  id: string
  name: string
  description: string
  logo: string          // emoji or icon key
  category: IntegrationCategory
  status: IntegrationStatus
  connectedAs?: string
  features?: string[]
  docsUrl?: string
}

const CATEGORY_CONFIG: Record<IntegrationCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  payments:  { label: "Payments",   icon: CreditCard, color: "text-brand-purple", bg: "bg-brand-purple/10" },
  logistics: { label: "Logistics",  icon: Truck,      color: "text-brand-green",  bg: "bg-brand-green/10"  },
  social:    { label: "Social",     icon: Share2,     color: "text-brand-coral",  bg: "bg-brand-coral/10"  },
  developer: { label: "Developer",  icon: Code2,      color: "text-amber-500",    bg: "bg-amber-500/10"    },
}

const INTEGRATIONS: Integration[] = [
  // Payments
  {
    id: "paystack",
    name: "Paystack",
    description: "Accept card payments, bank transfers, and USSD from Nigerian customers.",
    logo: "💳",
    category: "payments",
    status: "connected",
    connectedAs: "sade@sadeboutique.com",
    features: ["Card payments", "Bank transfer", "USSD", "Instant settlement", "Split payments"],
    docsUrl: "https://paystack.com/docs",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    description: "Multi-currency payments across 30+ African countries.",
    logo: "🌍",
    category: "payments",
    status: "disconnected",
    features: ["NGN, GHS, KES, ZAR", "Mobile money", "Bank transfer", "Pan-African coverage"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "International card payments for global customers.",
    logo: "🔵",
    category: "payments",
    status: "coming_soon",
    features: ["Global card acceptance", "USD/EUR/GBP", "Subscriptions"],
  },
  {
    id: "opay",
    name: "OPay",
    description: "Popular Nigerian fintech — wallets, bank transfer, and POS.",
    logo: "🟢",
    category: "payments",
    status: "coming_soon",
    features: ["OPay wallet", "Bank transfer", "Agent banking"],
  },
  // Logistics
  {
    id: "gig",
    name: "GIG Logistics",
    description: "Nigeria's leading courier for same-day and inter-state delivery.",
    logo: "🚚",
    category: "logistics",
    status: "connected",
    connectedAs: "API key: GIG-••••••••4521",
    features: ["Lagos same-day", "Inter-state 3-5 days", "Real-time tracking", "Pickup stations"],
  },
  {
    id: "kwik",
    name: "Kwik Delivery",
    description: "On-demand same-day delivery across major Nigerian cities.",
    logo: "⚡",
    category: "logistics",
    status: "disconnected",
    features: ["Same-day delivery", "Live GPS tracking", "Lagos & Abuja", "Auto-dispatch"],
  },
  {
    id: "dhl",
    name: "DHL Express",
    description: "International shipping for global orders.",
    logo: "✈️",
    category: "logistics",
    status: "disconnected",
    features: ["International shipping", "Express 1-3 days", "Customs support"],
  },
  {
    id: "aramex",
    name: "Aramex",
    description: "Pan-African and international courier service.",
    logo: "📦",
    category: "logistics",
    status: "coming_soon",
    features: ["Domestic & international", "Cash on delivery", "Africa-wide coverage"],
  },
  // Social
  {
    id: "instagram",
    name: "Instagram Shopping",
    description: "Tag your products in posts and stories. Drive traffic from bio link.",
    logo: "📸",
    category: "social",
    status: "connected",
    connectedAs: "@sade.styles",
    features: ["Product tags in posts", "Shopping stickers", "Bio link sync", "Insights"],
  },
  {
    id: "tiktok",
    name: "TikTok Shop",
    description: "Sell directly in TikTok videos and live streams.",
    logo: "🎵",
    category: "social",
    status: "disconnected",
    features: ["In-video product links", "Live shopping", "Creator affiliate"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    description: "Automated order notifications, broadcasts, and two-way messaging.",
    logo: "💬",
    category: "social",
    status: "connected",
    connectedAs: "+234 803 456 7890",
    features: ["Order notifications", "Broadcast lists", "Quick replies", "Catalogs"],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Share product drops and promotions to your Twitter audience.",
    logo: "🐦",
    category: "social",
    status: "disconnected",
    features: ["Auto-post drops", "Product cards", "Link in bio"],
  },
  // Developer
  {
    id: "api_keys",
    name: "Lummy API",
    description: "Programmatic access to your store, products, orders, and customers.",
    logo: "🔑",
    category: "developer",
    status: "connected",
    features: ["REST API v2", "Rate limit: 1000 req/min", "Webhooks", "OAuth 2.0"],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Real-time event delivery to your server on orders, payments, and more.",
    logo: "🪝",
    category: "developer",
    status: "connected",
    features: ["Order created/updated", "Payment confirmed", "Customer added", "Product updated"],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect Lummy to 5,000+ apps without code.",
    logo: "⚡",
    category: "developer",
    status: "coming_soon",
    features: ["Auto-sync orders to Google Sheets", "Slack notifications", "Email automations"],
  },
]

interface ConnectModalProps {
  integration: Integration
  onClose: () => void
  onConnect: (id: string) => void
}

function ConnectModal({ integration, onClose, onConnect }: ConnectModalProps) {
  const [step, setStep] = React.useState<"form" | "connecting" | "done">("form")
  const [apiKey, setApiKey] = React.useState("")
  const [secret, setSecret] = React.useState("")
  const [showSecret, setShowSecret] = React.useState(false)

  const isOAuth = ["instagram", "tiktok", "twitter"].includes(integration.id)
  const isApiKey = ["gig", "kwik", "dhl", "aramex", "flutterwave"].includes(integration.id)
  const isPaystack = integration.id === "paystack"

  const handleConnect = () => {
    if (!isOAuth && !apiKey.trim()) { toast({ title: "Enter your API key to connect" }); return }
    setStep("connecting")
    setTimeout(() => { setStep("done") }, 1800)
  }

  const handleDone = () => {
    onConnect(integration.id)
    onClose()
    toast({ title: `${integration.name} connected!`, description: "Your integration is now active." })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {step === "form" && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.logo}</span>
                <div>
                  <h2 className="font-display font-bold text-sm">Connect {integration.name}</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Secure connection via {isOAuth ? "OAuth 2.0" : "API key"}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Features list */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground mb-2">What you get</p>
                {integration.features?.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-brand-green flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {isOAuth ? (
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  You'll be redirected to {integration.name} to authorize access. No passwords are stored.
                </div>
              ) : isPaystack ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Public key</label>
                    <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="pk_live_•••••••••••••"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Secret key</label>
                    <div className="relative">
                      <input type={showSecret ? "text" : "password"} value={secret} onChange={e => setSecret(e.target.value)} placeholder="sk_live_•••••••••••••"
                        className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                      <button onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">API Key</label>
                  <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={`${integration.name.toUpperCase().replace(/\s/g, "_")}-••••••••••••`}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                  {integration.docsUrl && (
                    <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-1.5 flex items-center gap-1 text-[11px] text-brand-purple hover:underline">
                      <ExternalLink className="h-3 w-3" /> Where do I find my API key?
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-brand-green" />
                Your credentials are encrypted and never shared
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={handleConnect}>
                {isOAuth ? <><Globe className="h-4 w-4" /> Authorize with {integration.name}</> : "Connect"}
              </Button>
            </div>
          </>
        )}

        {step === "connecting" && (
          <div className="p-12 flex flex-col items-center gap-5">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-14 h-14 rounded-full border-4 border-brand-purple/20 border-t-brand-purple" />
            <div className="text-center">
              <p className="font-semibold text-sm">Connecting to {integration.name}…</p>
              <p className="text-xs text-muted-foreground mt-1">Verifying credentials</p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="p-10 flex flex-col items-center gap-5 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14, stiffness: 260 }}
              className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-brand-green" />
            </motion.div>
            <div>
              <h3 className="font-display font-extrabold text-lg">{integration.name} connected!</h3>
              <p className="text-sm text-muted-foreground mt-1.5">Your integration is live and ready to use.</p>
            </div>
            <Button className="gap-2" onClick={handleDone}>Done</Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function IntegrationCard({ integration, onConnect, onDisconnect }: {
  integration: Integration
  onConnect: (i: Integration) => void
  onDisconnect: (id: string) => void
}) {
  const cfg = CATEGORY_CONFIG[integration.category]
  const isConnected = integration.status === "connected"
  const isComingSoon = integration.status === "coming_soon"

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-card p-4 flex flex-col gap-3 transition-all",
        isConnected ? "border-brand-green/25 bg-brand-green/3" : "border-border",
        isComingSoon && "opacity-60"
      )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{integration.logo}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold">{integration.name}</p>
              {isConnected && <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />}
            </div>
            <div className={cn("flex items-center gap-1 text-[10px] font-semibold mt-0.5", cfg.color)}>
              <cfg.icon className="h-2.5 w-2.5" />
              {cfg.label}
            </div>
          </div>
        </div>
        {isComingSoon ? (
          <Badge variant="secondary" size="sm">Coming soon</Badge>
        ) : isConnected ? (
          <Badge variant="secondary" size="sm" className="bg-brand-green/10 text-brand-green border-brand-green/20">Connected</Badge>
        ) : (
          <Badge variant="secondary" size="sm">Not connected</Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>

      {integration.connectedAs && isConnected && (
        <div className="flex items-center gap-1.5 text-[10px] text-brand-green bg-brand-green/10 rounded-lg px-2.5 py-1.5">
          <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-medium">{integration.connectedAs}</span>
        </div>
      )}

      <div className="flex gap-1.5 mt-auto">
        {isConnected ? (
          <>
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1"
              onClick={() => toast({ title: `${integration.name} settings`, description: "Opening integration settings…" })}>
              <RefreshCw className="h-3 w-3" /> Manage
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive border-destructive/20 hover:bg-destructive/5"
              onClick={() => onDisconnect(integration.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        ) : isComingSoon ? (
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" disabled>
            Coming soon
          </Button>
        ) : (
          <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => onConnect(integration)}>
            <Plus className="h-3.5 w-3.5" /> Connect
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function ApiKeySection() {
  const [keyVisible, setKeyVisible] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const apiKey = "lm_live_sk_9f3d2a1b8c4e7f6a0d5e2c9b1a3f7e8d"
  const masked = "lm_live_sk_••••••••••••••••••••••••••••••••••"

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
    toast({ title: "API key copied" })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
          <Key className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <h3 className="font-display font-bold text-sm">API Keys</h3>
          <p className="text-[10px] text-muted-foreground">For custom integrations and developer access</p>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: "Live secret key", key: masked, masked: true },
          { label: "Live public key", key: "lm_live_pk_4a7b2c1d9e6f3a8b", masked: false },
        ].map(({ label, key, masked: isMasked }) => (
          <div key={label} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{label}</p>
              <code className="text-xs font-mono truncate block">
                {isMasked && !keyVisible ? masked : key}
              </code>
            </div>
            {isMasked && (
              <button onClick={() => setKeyVisible(v => !v)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                {keyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            )}
            <button onClick={copyKey} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <RefreshCw className="h-3 w-3" /> Rotate keys
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <Webhook className="h-3 w-3" /> Configure webhooks
        </Button>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = React.useState<Integration[]>(INTEGRATIONS)
  const [connectingTo, setConnectingTo] = React.useState<Integration | null>(null)
  const [activeCategory, setActiveCategory] = React.useState<IntegrationCategory | "all">("all")

  const filtered = activeCategory === "all"
    ? integrations
    : integrations.filter(i => i.category === activeCategory)

  const connectedCount = integrations.filter(i => i.status === "connected").length

  const handleConnect = (id: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, status: "connected" as const, connectedAs: "Connected successfully" } : i
    ))
  }

  const handleDisconnect = (id: string) => {
    const name = integrations.find(i => i.id === id)?.name
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, status: "disconnected" as const, connectedAs: undefined } : i
    ))
    toast({ title: `${name ?? "Integration"} disconnected` })
  }

  const categoryStats = (Object.keys(CATEGORY_CONFIG) as IntegrationCategory[]).map(cat => ({
    cat,
    total: integrations.filter(i => i.category === cat).length,
    connected: integrations.filter(i => i.category === cat && i.status === "connected").length,
  }))

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-extrabold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect your payments, logistics, and social accounts — {connectedCount} active
        </p>
      </div>

      {/* Category stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {categoryStats.map(({ cat, total, connected }, i) => {
          const cfg = CATEGORY_CONFIG[cat]
          return (
            <motion.button key={cat}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => setActiveCategory(activeCategory === cat ? "all" : cat)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                activeCategory === cat ? `${cfg.bg} border-current ${cfg.color}` : "border-border bg-card hover:bg-muted/40"
              )}>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl mb-2", cfg.bg)}>
                <cfg.icon className={cn("h-4 w-4", cfg.color)} />
              </div>
              <p className="font-display text-lg font-extrabold">{connected}/{total}</p>
              <p className={cn("text-[11px] mt-0.5", activeCategory === cat ? cfg.color : "text-muted-foreground")}>{cfg.label}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setActiveCategory("all")}
          className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
            activeCategory === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
          All ({integrations.length})
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [IntegrationCategory, typeof CATEGORY_CONFIG[IntegrationCategory]][]).map(([cat, cfg]) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5",
              activeCategory === cat ? `${cfg.bg} border-current ${cfg.color}` : "border-border text-muted-foreground hover:text-foreground")}>
            <cfg.icon className="h-3 w-3" /> {cfg.label}
          </button>
        ))}
      </div>

      {/* Integration cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((integration, i) => (
          <motion.div key={integration.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
            <IntegrationCard
              integration={integration}
              onConnect={setConnectingTo}
              onDisconnect={handleDisconnect}
            />
          </motion.div>
        ))}
      </div>

      {/* Developer API Keys section */}
      {(activeCategory === "all" || activeCategory === "developer") && (
        <ApiKeySection />
      )}

      <AnimatePresence>
        {connectingTo && (
          <ConnectModal
            integration={connectingTo}
            onClose={() => setConnectingTo(null)}
            onConnect={handleConnect}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
