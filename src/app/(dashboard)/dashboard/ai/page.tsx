"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  CheckCheck,
  Zap,
  MessageCircle,
  Tag,
  BarChart3,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  id: string
}

const promptSuggestions = [
  { icon: FileText, label: "Write caption", prompt: "Write an Instagram caption for my latest Ankara dress drop" },
  { icon: Tag, label: "Price this product", prompt: "Help me price my handmade beaded necklaces for the Nigerian market" },
  { icon: MessageCircle, label: "WhatsApp reply", prompt: "Write a WhatsApp reply template for customers asking about delivery times" },
  { icon: BarChart3, label: "Campaign idea", prompt: "Give me a campaign strategy for Christmas sales this December" },
  { icon: Sparkles, label: "Product description", prompt: "Write a compelling product description for a leather crossbody bag (₦18,000)" },
  { icon: Zap, label: "Growth tip", prompt: "What's the best way to convert my Instagram followers into WhatsApp buyers?" },
]

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

function AssistantMessage({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        <button
          onClick={handleCopy}
          className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? <CheckCheck className="h-3 w-3 text-brand-green" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy response"}
        </button>
      </div>
    </div>
  )
}

export default function AIPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content: "Hey Sade! 👋 I'm your Lummy AI assistant, powered by Claude. I know your store, your niche, and your audience.\n\nAsk me to write captions, plan campaigns, suggest prices, or draft WhatsApp reply templates. What are we working on today?",
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

    const userMsg: Message = { role: "user", content: text, id: Date.now().toString() }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const response = getResponse(text)
      setIsTyping(false)
      setMessages((m) => [...m, { role: "assistant", content: response, id: (Date.now() + 1).toString() }])
    }, 1200 + Math.random() * 800)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMessages([{
            role: "assistant",
            content: "New conversation started. What can I help you with?",
            id: Date.now().toString(),
          }])}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <AnimatePresence key={msg.id}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
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

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-brand-purple/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Prompt suggestions */}
      {messages.length === 1 && (
        <div className="flex-shrink-0 px-4 lg:px-6 pb-3">
          <p className="text-xs text-muted-foreground mb-2">Quick prompts</p>
          <div className="flex gap-2 flex-wrap">
            {promptSuggestions.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => sendMessage(prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border bg-card hover:bg-muted hover:border-brand-purple/30 transition-all"
              >
                <Icon className="h-3 w-3 text-brand-purple" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border px-4 lg:px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Lummy AI anything about your store…"
            className="flex-1 h-11"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" className="h-11 w-11 flex-shrink-0" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Lummy AI may produce inaccurate information. Always review before publishing.
        </p>
      </div>
    </div>
  )
}
