"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap, CheckCircle2, AlertCircle, Plus, X, Eye, EyeOff,
  Copy, CheckCheck, ExternalLink, RefreshCw, Trash2,
  CreditCard, Truck, Share2, Code2, Webhook, Key,
  ShieldCheck, Globe, Activity, Clock, ChevronDown,
  ChevronUp, Wifi, WifiOff, Send, BarChart3,
  AlertTriangle, Circle,
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
  logo: string
  category: IntegrationCategory
  status: IntegrationStatus
  connectedAs?: string
  features?: string[]
  docsUrl?: string
  lastSynced?: string   // ISO timestamp
  healthScore?: number  // 0-100
  requestsToday?: number
  requestLimit?: number
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
    id: "paystack", name: "Paystack",
    description: "Accept card payments, bank transfers, and USSD from Nigerian customers.",
    logo: "💳", category: "payments", status: "connected",
    connectedAs: "creator@example.com",
    features: ["Card payments", "Bank transfer", "USSD", "Instant settlement", "Split payments"],
    docsUrl: "https://paystack.com/docs",
    lastSynced: "2026-05-13T14:30:00Z", healthScore: 99,
    requestsToday: 124, requestLimit: 5000,
  },
  {
    id: "flutterwave", name: "Flutterwave",
    description: "Multi-currency payments across 30+ African countries.",
    logo: "🌍", category: "payments", status: "disconnected",
    features: ["NGN, GHS, KES, ZAR", "Mobile money", "Bank transfer", "Pan-African coverage"],
  },
  {
    id: "stripe", name: "Stripe",
    description: "International card payments for global customers.",
    logo: "🔵", category: "payments", status: "coming_soon",
    features: ["Global card acceptance", "USD/EUR/GBP", "Subscriptions"],
  },
  {
    id: "opay", name: "OPay",
    description: "Popular Nigerian fintech — wallets, bank transfer, and POS.",
    logo: "🟢", category: "payments", status: "coming_soon",
    features: ["OPay wallet", "Bank transfer", "Agent banking"],
  },
  // Logistics
  {
    id: "gig", name: "GIG Logistics",
    description: "Nigeria's leading courier for same-day and inter-state delivery.",
    logo: "🚚", category: "logistics", status: "connected",
    connectedAs: "API key: GIG-••••••••4521",
    features: ["Lagos same-day", "Inter-state 3-5 days", "Real-time tracking", "Pickup stations"],
    lastSynced: "2026-05-13T13:15:00Z", healthScore: 94,
    requestsToday: 37, requestLimit: 1000,
  },
  {
    id: "kwik", name: "Kwik Delivery",
    description: "On-demand same-day delivery across major Nigerian cities.",
    logo: "⚡", category: "logistics", status: "disconnected",
    features: ["Same-day delivery", "Live GPS tracking", "Lagos & Abuja", "Auto-dispatch"],
  },
  {
    id: "dhl", name: "DHL Express",
    description: "International shipping for global orders.",
    logo: "✈️", category: "logistics", status: "disconnected",
    features: ["International shipping", "Express 1-3 days", "Customs support"],
  },
  {
    id: "aramex", name: "Aramex",
    description: "Pan-African and international courier service.",
    logo: "📦", category: "logistics", status: "coming_soon",
    features: ["Domestic & international", "Cash on delivery", "Africa-wide coverage"],
  },
  // Social
  {
    id: "instagram", name: "Instagram Shopping",
    description: "Tag your products in posts and stories. Drive traffic from bio link.",
    logo: "📸", category: "social", status: "connected",
    connectedAs: "@yourhandle",
    features: ["Product tags in posts", "Shopping stickers", "Bio link sync", "Insights"],
    lastSynced: "2026-05-13T12:00:00Z", healthScore: 87,
  },
  {
    id: "tiktok", name: "TikTok Shop",
    description: "Sell directly in TikTok videos and live streams.",
    logo: "🎵", category: "social", status: "disconnected",
    features: ["In-video product links", "Live shopping", "Creator affiliate"],
  },
  {
    id: "whatsapp", name: "WhatsApp Business API",
    description: "Automated order notifications, broadcasts, and two-way messaging.",
    logo: "💬", category: "social", status: "connected",
    connectedAs: "+234 803 456 7890",
    features: ["Order notifications", "Broadcast lists", "Quick replies", "Catalogs"],
    lastSynced: "2026-05-13T14:45:00Z", healthScore: 100,
    requestsToday: 312, requestLimit: 10000,
  },
  {
    id: "twitter", name: "X (Twitter)",
    description: "Share product drops and promotions to your Twitter audience.",
    logo: "🐦", category: "social", status: "disconnected",
    features: ["Auto-post drops", "Product cards", "Link in bio"],
  },
  // Developer
  {
    id: "api_keys", name: "Lummy API",
    description: "Programmatic access to your store, products, orders, and customers.",
    logo: "🔑", category: "developer", status: "connected",
    features: ["REST API v2", "Rate limit: 1000 req/min", "Webhooks", "OAuth 2.0"],
    lastSynced: "2026-05-13T14:55:00Z", healthScore: 100,
    requestsToday: 847, requestLimit: 1440000,
  },
  {
    id: "webhooks", name: "Webhooks",
    description: "Real-time event delivery to your server on orders, payments, and more.",
    logo: "🪝", category: "developer", status: "connected",
    features: ["Order created/updated", "Payment confirmed", "Customer added", "Product updated"],
    lastSynced: "2026-05-13T14:50:00Z", healthScore: 96,
  },
  {
    id: "zapier", name: "Zapier",
    description: "Connect Lummy to 5,000+ apps without code.",
    logo: "⚡", category: "developer", status: "coming_soon",
    features: ["Auto-sync orders to Google Sheets", "Slack notifications", "Email automations"],
  },
]

interface WebhookDelivery {
  id: string; event: string; url: string; status: "success" | "failed" | "pending"
  statusCode: number; timestamp: string; duration: number
}

const MOCK_DELIVERIES: WebhookDelivery[] = [
  { id: "d1", event: "order.created",    url: "https://myapp.com/hooks/lummy", status: "success", statusCode: 200, timestamp: "2026-05-13T14:52:11Z", duration: 142 },
  { id: "d2", event: "payment.confirmed", url: "https://myapp.com/hooks/lummy", status: "success", statusCode: 200, timestamp: "2026-05-13T14:49:03Z", duration: 98  },
  { id: "d3", event: "order.updated",    url: "https://myapp.com/hooks/lummy", status: "failed",  statusCode: 502, timestamp: "2026-05-13T13:31:44Z", duration: 3001 },
  { id: "d4", event: "customer.created", url: "https://myapp.com/hooks/lummy", status: "success", statusCode: 200, timestamp: "2026-05-13T12:17:28Z", duration: 115 },
  { id: "d5", event: "product.updated",  url: "https://myapp.com/hooks/lummy", status: "success", statusCode: 200, timestamp: "2026-05-13T11:55:07Z", duration: 201 },
]

interface ActivityEntry {
  id: string; icon: string; title: string; detail: string; time: string; type: "success" | "warning" | "info"
}

const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: "a1", icon: "💳", title: "Payment received via Paystack", detail: "$45.00 — Order #1042", time: "2 min ago", type: "success" },
  { id: "a2", icon: "🚚", title: "Shipment dispatched via GIG", detail: "Tracking: GIG-9943821", time: "18 min ago", type: "success" },
  { id: "a3", icon: "💬", title: "WhatsApp notification sent", detail: "Order confirmation · 1 recipient", time: "21 min ago", type: "info" },
  { id: "a4", icon: "📸", title: "Instagram sync delayed", detail: "Product catalog update pending", time: "1 hr ago", type: "warning" },
  { id: "a5", icon: "💳", title: "Payment received via Paystack", detail: "$12.50 — Order #1041", time: "2 hr ago", type: "success" },
]

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function HealthDot({ score }: { score: number }) {
  const color = score >= 95 ? "bg-brand-green" : score >= 80 ? "bg-amber-400" : "bg-red-400"
  return <span className={cn("w-2 h-2 rounded-full flex-shrink-0", color)} />
}

function TestConnectionButton({ name }: { name: string }) {
  const [state, setState] = React.useState<"idle" | "testing" | "ok" | "fail">("idle")

  const run = () => {
    setState("testing")
    setTimeout(() => setState("ok"), 1600)
    setTimeout(() => setState("idle"), 4000)
  }

  return (
    <button
      onClick={run}
      disabled={state === "testing"}
      className={cn(
        "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-all",
        state === "idle" && "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
        state === "testing" && "border-amber-500/30 text-amber-500 bg-amber-500/5",
        state === "ok" && "border-brand-green/30 text-brand-green bg-brand-green/5",
        state === "fail" && "border-red-400/30 text-red-400 bg-red-400/5",
      )}
    >
      {state === "testing" && <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-3 h-3 rounded-full border-2 border-current border-t-transparent" />}
      {state === "ok" && <CheckCircle2 className="h-3 w-3" />}
      {state === "fail" && <AlertCircle className="h-3 w-3" />}
      {state === "idle" && <Wifi className="h-3 w-3" />}
      {state === "idle" ? "Test" : state === "testing" ? "Testing…" : state === "ok" ? "Healthy" : "Failed"}
    </button>
  )
}

function WebhookLogPanel() {
  const [open, setOpen] = React.useState(false)
  const [webhookUrl, setWebhookUrl] = React.useState("https://myapp.com/hooks/lummy")
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(webhookUrl)

  const saveUrl = () => {
    setWebhookUrl(draft)
    setEditing(false)
    toast({ title: "Webhook URL saved", description: "Events will be sent to the new endpoint." })
  }

  const successRate = Math.round((MOCK_DELIVERIES.filter(d => d.status === "success").length / MOCK_DELIVERIES.length) * 100)

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
            <Webhook className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Webhook Delivery Log</p>
            <p className="text-[10px] text-muted-foreground">{successRate}% success rate · {MOCK_DELIVERIES.length} recent events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm" className="bg-brand-green/10 text-brand-green border-brand-green/20">
            {successRate}%
          </Badge>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {/* Endpoint row */}
              <div className="px-5 py-3 bg-muted/30 flex items-center gap-2 border-b border-border">
                <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {editing ? (
                  <>
                    <input
                      value={draft} onChange={e => setDraft(e.target.value)}
                      className="flex-1 text-xs font-mono px-2 py-1 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                    />
                    <button onClick={saveUrl} className="text-[11px] font-semibold text-brand-purple hover:underline">Save</button>
                    <button onClick={() => { setEditing(false); setDraft(webhookUrl) }} className="text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                  </>
                ) : (
                  <>
                    <code className="flex-1 text-xs font-mono text-muted-foreground truncate">{webhookUrl}</code>
                    <button onClick={() => setEditing(true)} className="text-[11px] font-semibold text-brand-purple hover:underline flex-shrink-0">Edit</button>
                    <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: "URL copied" }) }}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground flex-shrink-0">
                      <Copy className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>

              {/* Deliveries table */}
              <div className="divide-y divide-border">
                {MOCK_DELIVERIES.map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 text-[10px] font-bold",
                      d.status === "success" ? "bg-brand-green/10 text-brand-green" : "bg-red-500/10 text-red-500"
                    )}>
                      {d.status === "success" ? "✓" : "✗"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-mono">{d.event}</p>
                      <p className="text-[10px] text-muted-foreground">{d.duration}ms · {formatTimeAgo(d.timestamp)}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold font-mono px-1.5 py-0.5 rounded",
                      d.statusCode === 200 ? "bg-brand-green/10 text-brand-green" : "bg-red-500/10 text-red-500"
                    )}>
                      {d.statusCode}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-border flex gap-2">
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                  <Send className="h-3 w-3" /> Send test event
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                  <RefreshCw className="h-3 w-3" /> Retry failed
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display font-bold text-sm">Integration Activity</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">Last 24h</span>
      </div>
      <div className="divide-y divide-border">
        {MOCK_ACTIVITY.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-start gap-3 px-5 py-3"
          >
            <span className="text-lg leading-none mt-0.5 flex-shrink-0">{entry.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold truncate">{entry.title}</p>
                {entry.type === "warning" && <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{entry.detail}</p>
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{entry.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ApiUsageMeter({ requestsToday, requestLimit, name }: { requestsToday: number; requestLimit: number; name: string }) {
  const pct = Math.min((requestsToday / requestLimit) * 100, 100)
  const barColor = pct > 80 ? "bg-red-500" : pct > 60 ? "bg-amber-400" : "bg-brand-green"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground font-semibold">{name} requests today</span>
        <span className="font-bold">{requestsToday.toLocaleString()} / {requestLimit.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", barColor)}
        />
      </div>
    </div>
  )
}

function ApiKeySection({ integrations }: { integrations: Integration[] }) {
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

  const apiIntegration = integrations.find(i => i.id === "api_keys")
  const waIntegration = integrations.find(i => i.id === "whatsapp")
  const paystackIntegration = integrations.find(i => i.id === "paystack")

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
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

      {/* API usage meters */}
      <div className="space-y-3 pt-1">
        {apiIntegration?.requestsToday !== undefined && apiIntegration.requestLimit && (
          <ApiUsageMeter
            requestsToday={apiIntegration.requestsToday}
            requestLimit={apiIntegration.requestLimit}
            name="Lummy API"
          />
        )}
        {paystackIntegration?.requestsToday !== undefined && paystackIntegration.requestLimit && (
          <ApiUsageMeter
            requestsToday={paystackIntegration.requestsToday}
            requestLimit={paystackIntegration.requestLimit}
            name="Paystack"
          />
        )}
        {waIntegration?.requestsToday !== undefined && waIntegration.requestLimit && (
          <ApiUsageMeter
            requestsToday={waIntegration.requestsToday}
            requestLimit={waIntegration.requestLimit}
            name="WhatsApp"
          />
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => toast({ title: "Rotating keys…", description: "New keys will be active in 30 seconds." })}>
          <RefreshCw className="h-3 w-3" /> Rotate keys
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => toast({ title: "Opening webhook config" })}>
          <Webhook className="h-3 w-3" /> Configure webhooks
        </Button>
      </div>
    </div>
  )
}

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
              {isConnected && integration.healthScore !== undefined && (
                <HealthDot score={integration.healthScore} />
              )}
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
          <span className="truncate font-medium flex-1">{integration.connectedAs}</span>
          {integration.lastSynced && (
            <span className="text-brand-green/70 flex-shrink-0 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatTimeAgo(integration.lastSynced)}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-1.5 mt-auto">
        {isConnected ? (
          <>
            <TestConnectionButton name={integration.name} />
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1"
              onClick={() => toast({ title: `${integration.name} settings`, description: "Opening integration settings…" })}>
              <RefreshCw className="h-3 w-3" /> Sync now
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

function IntegrationHealthDashboard({ integrations }: { integrations: Integration[] }) {
  const connected = integrations.filter(i => i.status === "connected")
  const scores = connected.filter(i => i.healthScore !== undefined).map(i => i.healthScore!)
  const avgHealth = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const healthy = connected.filter(i => (i.healthScore ?? 100) >= 90).length
  const warnings = connected.filter(i => (i.healthScore ?? 100) < 90 && (i.healthScore ?? 100) >= 70).length
  const critical = connected.filter(i => (i.healthScore ?? 100) < 70).length

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Integration Health</p>
        <div className={cn(
          "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
          avgHealth >= 90 ? "bg-brand-green/10 text-brand-green" : avgHealth >= 70 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
        )}>
          {avgHealth}% avg
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-brand-green/5 border border-brand-green/15 p-3 text-center">
          <p className="font-display text-xl font-extrabold text-brand-green">{healthy}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Healthy</p>
        </div>
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 text-center">
          <p className="font-display text-xl font-extrabold text-amber-500">{warnings}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Warnings</p>
        </div>
        <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-3 text-center">
          <p className="font-display text-xl font-extrabold text-red-500">{critical}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Critical</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {connected.filter(i => i.healthScore !== undefined).map(i => (
          <div key={i.id} className="flex items-center gap-2">
            <span className="text-sm">{i.logo}</span>
            <span className="text-[10px] text-muted-foreground flex-1 truncate">{i.name}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${i.healthScore}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={cn("h-full rounded-full", (i.healthScore ?? 0) >= 90 ? "bg-brand-green" : "bg-amber-400")}
                />
              </div>
              <span className="text-[10px] font-bold w-8 text-right">{i.healthScore}%</span>
            </div>
          </div>
        ))}
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
      i.id === id ? { ...i, status: "connected" as const, connectedAs: "Connected successfully", healthScore: 100, lastSynced: new Date().toISOString() } : i
    ))
  }

  const handleDisconnect = (id: string) => {
    const name = integrations.find(i => i.id === id)?.name
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, status: "disconnected" as const, connectedAs: undefined, healthScore: undefined } : i
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

      {/* Health dashboard */}
      <IntegrationHealthDashboard integrations={integrations} />

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

      {/* Developer tools */}
      {(activeCategory === "all" || activeCategory === "developer") && (
        <div className="space-y-4">
          <ApiKeySection integrations={integrations} />
          <WebhookLogPanel />
          <ActivityFeed />
        </div>
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
