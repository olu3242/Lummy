"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot, Sparkles, Send, RotateCcw, Copy, CheckCheck,
  Zap, MessageCircle, Tag, BarChart3, FileText,
  Hash, PenLine, DollarSign, Wand2, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message { role: "user" | "assistant"; content: string; id: string }

// ─── AI tools config ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    id: "caption",
    icon: PenLine,
    label: "Caption Generator",
    description: "Instagram & TikTok captions for any product drop",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    fields: [
      { key: "product", label: "Product name", placeholder: "e.g. Ankara Print Dress" },
      { key: "occasion", label: "Occasion / theme", placeholder: "e.g. New drop, Flash sale, Restock" },
      { key: "tone", label: "Tone", placeholder: "e.g. Hype, Elegant, Playful", optional: true },
    ],
    generate: (f: Record<string, string>) =>
      `🔥 ${f.occasion?.toUpperCase() || "NEW DROP"} ALERT!\n\nMeet the ${f.product} — she's giving EVERYTHING. Bold. Premium. Unapologetically African. ✨\n\nLimited stock available now. Order via the WhatsApp link in bio 👆 — last drop sold out in 48hrs 🏃🏾‍♀️\n\nTag someone who needs this in their wardrobe 💜\n\n#${f.product?.replace(/\s+/g, "")} #LagosStyle #AfricanFashion #MadeInNigeria #${f.occasion?.replace(/\s+/g, "") || "NewDrop"} #SadeStyles`,
  },
  {
    id: "hashtags",
    icon: Hash,
    label: "Hashtag Pack",
    description: "30+ targeted hashtags for your niche and audience",
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
    fields: [
      { key: "niche", label: "Your niche", placeholder: "e.g. Ankara fashion, Skincare, Jewellery" },
      { key: "market", label: "Target market", placeholder: "e.g. Lagos, Nigeria, Pan-African" },
    ],
    generate: (f: Record<string, string>) => {
      const niche = f.niche || "fashion"
      const market = f.market || "Nigeria"
      return `📌 **Hashtag Pack — ${niche} (${market})**\n\n🔥 High-volume:\n#${niche.replace(/\s+/g, "")} #${market.replace(/\s+/g, "")}Fashion #AfricanStyle #MadeInAfrica #BlackOwnedBusiness\n\n💎 Mid-range:\n#LagosCreators #NaijaShopping #ShopSmall #AfricanCreators #LummyStore #WhatsAppBusiness #NaijaEntrepreneur\n\n✨ Niche-specific:\n#${niche.split(" ")[0]}Lover #African${niche.replace(/\s+/g, "")} #${market.replace(/\s+/g, "")}Style #AfricanPrint #CulturalFashion #LocalIsBest #BuyAfrican\n\n🎯 Engagement:\n#ShopNow #LinkInBio #NewDrop #LimitedStock #ExclusiveCollection #OrderNow #WhatsAppOnly\n\n💡 Tip: Mix 5–7 hashtags per post for best reach.`
    },
  },
  {
    id: "description",
    icon: FileText,
    label: "Product Description",
    description: "Compelling copy that converts browsers into buyers",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    fields: [
      { key: "name", label: "Product name", placeholder: "e.g. Handcrafted Beaded Necklace" },
      { key: "price", label: "Price (₦)", placeholder: "e.g. 12500" },
      { key: "material", label: "Key features", placeholder: "e.g. Hand-beaded, Yoruba pattern, adjustable" },
    ],
    generate: (f: Record<string, string>) =>
      `✨ ${f.name}\n\nHandcrafted with love and precision, this ${f.name?.toLowerCase()} is more than an accessory — it's a statement. ${f.material ? `Made with ${f.material.toLowerCase()}, every detail has been thoughtfully considered.` : ""}\n\n🌍 Rooted in African artistry, designed for the modern woman who owns every room she walks into.\n\n💫 **Why you'll love it:**\n• Premium quality materials sourced locally\n• Each piece is uniquely handcrafted — no two are identical\n• Arrives beautifully packaged, perfect as a gift\n• Backed by our 100% satisfaction guarantee\n\n💰 **Price: ₦${parseInt(f.price || "0").toLocaleString()}**\n\nDM to order now or tap the WhatsApp button. Limited stock — don't sleep on this one! 🛍️`,
  },
  {
    id: "pricing",
    icon: DollarSign,
    label: "Price Suggester",
    description: "Data-backed pricing tiers for your Nigerian market",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    fields: [
      { key: "product", label: "Product type", placeholder: "e.g. Handmade bag, Ankara dress, Skincare set" },
      { key: "cost", label: "Production cost (₦)", placeholder: "e.g. 5000" },
      { key: "audience", label: "Target audience", placeholder: "e.g. Working-class women, Students, VIPs" },
    ],
    generate: (f: Record<string, string>) => {
      const cost = parseInt(f.cost || "5000")
      const t1 = Math.round(cost * 1.8 / 500) * 500
      const t2 = Math.round(cost * 2.5 / 500) * 500
      const t3 = Math.round(cost * 3.5 / 500) * 500
      return `💰 **Pricing Strategy — ${f.product}**\n\n📊 Market-based tiers:\n\n🟢 **Entry** — ₦${t1.toLocaleString()}\nFor new customers, bundle offers, or lightweight versions. Good for volume.\n\n🟡 **Standard** — ₦${t2.toLocaleString()} *(recommended)*\nYour sweet spot. Covers costs, leaves solid margin, competitive for your niche.\n\n🟣 **Premium** — ₦${t3.toLocaleString()}\nFor bespoke orders, limited editions, or VIP customers. Lean into the story.\n\n📈 **Margin analysis:**\n• Cost: ₦${cost.toLocaleString()}\n• Standard margin: ${Math.round(((t2 - cost) / t2) * 100)}%\n• Monthly break-even at standard price: ${Math.ceil(50000 / (t2 - cost))} units\n\n💡 **Pro tip:** ${f.audience ? `For ${f.audience.toLowerCase()}, lead with value messaging — not discounts.` : "Bundle 2 items at 15% off to increase average order value."}`
    },
  },
] as const


// ─── Chat mock responses ──────────────────────────────────────────────────────

const mockResponses: Record<string, string> = {
  caption: `🔥 NEW DROP ALERT!\n\nThis Ankara Print Dress just dropped and she's giving EVERYTHING. Bold. Vibrant. Unapologetically African. ✨\n\nSizes S–XL available NOW. Order via the WhatsApp link in bio 👆 — last drop sold out in 48hrs 🏃🏾‍♀️\n\nTag a friend who needs this in their wardrobe 💜\n\n#AnkaraFashion #LagosStyle #AfricanPrint #SadeStyles #MadeInNigeria`,
  price: `Based on your market position and niche, here are my pricing recommendations for handmade beaded necklaces:\n\n💎 **Tier 1 — Basic Sets:** ₦7,000–₦9,000\n✨ **Tier 2 — Premium Sets:** ₦12,000–₦16,000\n👑 **Tier 3 — Custom/Bespoke:** ₦20,000–₦35,000\n\n**Why this works:**\n- Your 21k engaged audience values authenticity\n- Handmade commands a 40-60% premium over mass-produced\n- Bundle 2 pieces at 15% discount to increase AOV\n\n**Pro tip:** Always lead with the story — "hand-crafted in Enugu" converts better than just "beaded necklace" 🪡`,
  whatsapp: `Hi [Customer Name]! 👋 Thanks for reaching out to Sade's Store.\n\nRegarding delivery:\n📍 **Lagos:** 1–2 business days via GIG Logistics\n🚚 **Abuja:** 2–3 business days\n🗺️ **Other states:** 3–5 business days\n\nOnce your order is dispatched, you'll receive a tracking number via WhatsApp.\n\nWant to confirm your order now? I'll send you a secure payment link 💳`,
  campaign: `Here's your **December Christmas Campaign Strategy** 🎄\n\n**Theme:** "Give the Gift of African Excellence"\n\n**Week 1 (Dec 1-7):** Teaser posts — "Something big is coming to Sade's Store"\n**Week 2 (Dec 8-14):** DROP — New holiday collection with limited stock messaging\n**Week 3 (Dec 15-21):** Gift guides + bundle deals (3 items = 20% off)\n**Week 4 (Dec 22-26):** Last-chance messaging + WhatsApp broadcast to past customers\n\n**Estimated revenue uplift:** 35–60% vs a normal month\n\n**Top channels:** WhatsApp broadcast first → Instagram Stories → Feed posts`,
  default: `Great question! As your AI growth partner, I can help you with:\n\n✍️ **Content creation** — Captions, product descriptions, hashtags\n💰 **Pricing strategy** — Market-rate recommendations for your niche\n💬 **WhatsApp commerce** — Reply templates, broadcast messages\n📊 **Campaign planning** — Seasonal strategies, launch plans\n🎯 **Growth tips** — Platform-specific advice for African creators\n\nWhat would you like to work on today? Ask me anything about your Lummy store 🚀`,
}

function getResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes("caption") || lower.includes("instagram") || lower.includes("dress")) return mockResponses.caption
  if (lower.includes("price") || lower.includes("necklace") || lower.includes("beaded")) return mockResponses.price
  if (lower.includes("whatsapp") || lower.includes("reply") || lower.includes("delivery")) return mockResponses.whatsapp
  if (lower.includes("campaign") || lower.includes("christmas") || lower.includes("strategy")) return mockResponses.campaign
  return mockResponses.default
}

const promptSuggestions = [
  { icon: FileText,    label: "Write caption",       prompt: "Write an Instagram caption for my latest Ankara dress drop" },
  { icon: Tag,         label: "Price this product",  prompt: "Help me price my handmade beaded necklaces for the Nigerian market" },
  { icon: MessageCircle, label: "WhatsApp reply",   prompt: "Write a WhatsApp reply template for customers asking about delivery times" },
  { icon: BarChart3,   label: "Campaign idea",       prompt: "Give me a campaign strategy for Christmas sales this December" },
  { icon: Sparkles,    label: "Product description", prompt: "Write a compelling product description for a leather crossbody bag (₦18,000)" },
  { icon: Zap,         label: "Growth tip",          prompt: "What's the best way to convert my Instagram followers into WhatsApp buyers?" },
]

// ─── CopyButton ──────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)
  const handle = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={handle} className={cn("flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors", className)}>
      {copied ? <CheckCheck className="h-3 w-3 text-brand-green" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

// ─── AssistantMessage ─────────────────────────────────────────────────────────

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-brand-purple">Lummy AI</span>
          <Badge variant="brand" size="sm" className="text-[9px]">Claude</Badge>
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-line">{content}</p>
        </div>
        <CopyButton text={content} className="mt-1.5 opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  )
}

// ─── ToolCard ─────────────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: typeof TOOLS[number] }) {
  const [fields, setFields] = React.useState<Record<string, string>>({})
  const [output, setOutput] = React.useState("")
  const [generating, setGenerating] = React.useState(false)

  const setField = (key: string, val: string) => setFields(f => ({ ...f, [key]: val }))

  const generate = () => {
    setGenerating(true)
    setOutput("")
    const full = tool.generate(fields)
    let i = 0
    const interval = setInterval(() => {
      i += 3
      setOutput(full.slice(0, i))
      if (i >= full.length) { clearInterval(interval); setGenerating(false) }
    }, 12)
  }

  const canGenerate = tool.fields
    .filter(f => !("optional" in f && f.optional))
    .every(f => (fields[f.key] ?? "").trim().length > 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0", tool.bg)}>
          <tool.icon className={cn("h-4.5 w-4.5", tool.color)} />
        </div>
        <div>
          <p className="text-sm font-bold">{tool.label}</p>
          <p className="text-xs text-muted-foreground">{tool.description}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-2.5">
        {tool.fields.map(f => (
          <div key={f.key}>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              {f.label}{"optional" in f && f.optional && <span className="font-normal ml-1">(optional)</span>}
            </label>
            <input
              value={fields[f.key] ?? ""}
              onChange={e => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            />
          </div>
        ))}
      </div>

      {/* Generate button */}
      <Button size="sm" onClick={generate} disabled={!canGenerate || generating} className="w-full gap-2 h-9">
        {generating
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
          : <><Wand2 className="h-3.5 w-3.5" />Generate</>}
      </Button>

      {/* Output */}
      <AnimatePresence>
        {output && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2">
            <p className="text-xs leading-relaxed whitespace-pre-line text-foreground">{output}</p>
            {!generating && (
              <div className="flex items-center gap-3 pt-1 border-t border-border">
                <CopyButton text={output} />
                <button onClick={() => { setOutput(""); generate() }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <RotateCcw className="h-3 w-3" /> Regenerate
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AIPage() {
  const [activeTab, setActiveTab] = React.useState<"chat" | "tools">("chat")
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content: "Hey Sade! 👋 I'm your Lummy AI assistant, powered by Claude. I know your store, your niche, and your audience.\n\nAsk me to write captions, plan campaigns, suggest prices, or draft WhatsApp reply templates. Or switch to the **Tools** tab for dedicated generators. What are we working on today?",
      id: "init",
    },
  ])
  const [input, setInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    setMessages(m => [...m, { role: "user", content: text, id: Date.now().toString() }])
    setInput("")
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(m => [...m, { role: "assistant", content: getResponse(text), id: (Date.now() + 1).toString() }])
    }, 1200 + Math.random() * 800)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo">
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base flex items-center gap-2">
              AI Assistant
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            </h1>
            <p className="text-xs text-muted-foreground">Powered by Claude · Knows your store</p>
          </div>
        </div>
        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
          {(["chat", "tools"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {tab === "chat" ? <MessageCircle className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {tab === "chat" ? "Chat" : "Tools"}
            </button>
          ))}
        </div>
      </div>

      {/* Chat tab */}
      {activeTab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
            {messages.map(msg => (
              <AnimatePresence key={msg.id}>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-purple/10 border border-brand-purple/20 px-4 py-3">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <AssistantMessage content={msg.content} />
                  )}
                </motion.div>
              </AnimatePresence>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-brand-purple/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="flex-shrink-0 px-4 lg:px-6 pb-3">
              <p className="text-xs text-muted-foreground mb-2">Quick prompts</p>
              <div className="flex gap-2 flex-wrap">
                {promptSuggestions.map(({ icon: Icon, label, prompt }) => (
                  <button key={label} onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border bg-card hover:bg-muted hover:border-brand-purple/30 transition-all">
                    <Icon className="h-3 w-3 text-brand-purple" />{label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-shrink-0 border-t border-border px-4 lg:px-6 py-4">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Ask Lummy AI anything about your store…" className="flex-1 h-11" disabled={isTyping} />
              <Button type="submit" size="icon" className="h-11 w-11 flex-shrink-0" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              Lummy AI may produce inaccurate information. Always review before publishing.
            </p>
          </div>
        </>
      )}

      {/* Tools tab */}
      {activeTab === "tools" && (
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          <div className="mb-5">
            <h2 className="font-display font-bold text-base">AI Tools</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Dedicated generators for captions, hashtags, descriptions & pricing</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </div>
      )}
    </div>
  )
}
