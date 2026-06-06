"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Sparkles, TrendingUp, TrendingDown, Minus, RefreshCw, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/globalization"

// ── Types ─────────────────────────────────────────────────────────────────────

interface CopilotMessage {
  id: string
  role: "user" | "assistant"
  content: string
  agent?: string
  agentDisplayName?: string
  recommendations?: { title: string; description: string; impactScore: number }[]
  storeHealth?: number
  successScore?: number
  timestamp: Date
}

interface Briefing {
  storeHealth: number
  successScore: number
  sections: { title: string; summary: string; trend: "up" | "down" | "stable"; value: string }[]
  topRecommendation: string
  forecast: { low: number; mid: number; high: number }
}

// ── Suggested Questions ───────────────────────────────────────────────────────

const SUGGESTED = [
  "Why are my sales down this week?",
  "How do I increase my revenue?",
  "Where is my payout?",
  "Why did a payment fail?",
  "How healthy is my store?",
  "What products should I focus on?",
]

// ── Score Display ─────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - score / 100)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6"
            className={color} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-display font-bold">{score}</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</span>
    </div>
  )
}

// ── Briefing Panel ────────────────────────────────────────────────────────────

function BriefingPanel({ briefing }: { briefing: Briefing }) {
  const TrendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-sm">Today&apos;s Briefing</h2>
        <div className="flex items-center gap-4">
          <ScoreRing score={briefing.storeHealth} label="Store" color="text-brand-purple" />
          <ScoreRing score={briefing.successScore} label="Success" color="text-brand-green" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {briefing.sections.map(s => {
          const Icon = TrendIcon[s.trend]
          return (
            <div key={s.title} className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.title}</p>
                <Icon className={cn("h-3 w-3", s.trend === "up" ? "text-brand-green" : s.trend === "down" ? "text-brand-coral" : "text-muted-foreground")} />
              </div>
              <p className="text-sm font-display font-bold truncate">{s.value}</p>
            </div>
          )
        })}
      </div>

      {briefing.topRecommendation && (
        <div className="flex items-start gap-2 rounded-xl bg-brand-purple/5 border border-brand-purple/20 p-3">
          <Sparkles className="h-3.5 w-3.5 text-brand-purple mt-0.5 flex-shrink-0" />
          <p className="text-xs text-brand-purple font-medium">{briefing.topRecommendation}</p>
        </div>
      )}

      {briefing.forecast.mid > 0 && (
        <p className="text-[10px] text-muted-foreground">
          30-day revenue forecast: {formatMoney(briefing.forecast.low)} – {formatMoney(briefing.forecast.high)}
        </p>
      )}
    </div>
  )
}

// ── Message Bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: CopilotMessage }) {
  const isUser = msg.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center mr-2 mt-0.5">
          <Sparkles className="h-4 w-4 text-brand-purple" />
        </div>
      )}
      <div className={cn("max-w-[85%] space-y-2", isUser ? "items-end flex flex-col" : "")}>
        {!isUser && msg.agentDisplayName && (
          <p className="text-[10px] font-semibold text-brand-purple ml-1">{msg.agentDisplayName} agent</p>
        )}
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-brand-purple text-white rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm"
        )}>
          {msg.content}
        </div>

        {/* Recommendations */}
        {msg.recommendations && msg.recommendations.length > 0 && (
          <div className="space-y-1.5 w-full">
            {msg.recommendations.slice(0, 2).map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    r.impactScore >= 80 ? "bg-brand-coral" : r.impactScore >= 60 ? "bg-amber-500" : "bg-brand-green")} />
                  <div>
                    <p className="text-xs font-semibold">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{r.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scores */}
        {(msg.storeHealth !== undefined || msg.successScore !== undefined) && (
          <div className="flex gap-3 mt-1">
            {msg.storeHealth !== undefined && (
              <span className="text-[11px] text-muted-foreground">Store Health: <strong className="text-foreground">{msg.storeHealth}/100</strong></span>
            )}
            {msg.successScore !== undefined && (
              <span className="text-[11px] text-muted-foreground">Success Score: <strong className="text-foreground">{msg.successScore}/100</strong></span>
            )}
          </div>
        )}

        <p className="text-[9px] text-muted-foreground/60 mt-1 px-1">
          {msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CopilotPage() {
  const [messages, setMessages] = React.useState<CopilotMessage[]>([])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [briefing, setBriefing] = React.useState<Briefing | null>(null)
  const [briefingLoading, setBriefingLoading] = React.useState(true)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetch("/api/copilot?briefing=daily")
      .then(r => r.ok ? r.json() : null)
      .then((res: { data?: Briefing } | null) => { if (res?.data) setBriefing(res.data) })
      .catch(() => {})
      .finally(() => setBriefingLoading(false))
  }, [])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return
    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(), role: "user", content: question, timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })
      const data = await res.json() as {
        data?: {
          answer: string
          agentDisplayName: string
          recommendations: CopilotMessage["recommendations"]
          storeHealth?: number
          successScore?: number
        }
      }
      if (data.data) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.data!.answer,
          agentDisplayName: data.data!.agentDisplayName,
          recommendations: data.data!.recommendations,
          storeHealth: data.data!.storeHealth,
          successScore: data.data!.successScore,
          timestamp: new Date(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: "I couldn't process that right now. Please try again.",
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-purple flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold">Ask Lummy</h1>
            <p className="text-xs text-muted-foreground">Your AI business copilot</p>
          </div>
        </div>
      </div>

      {/* Briefing */}
      <div className="flex-shrink-0 mb-4">
        {briefingLoading ? (
          <div className="rounded-2xl bg-muted animate-pulse h-32" />
        ) : briefing ? (
          <BriefingPanel briefing={briefing} />
        ) : null}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center font-semibold uppercase tracking-wide">Suggested questions</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm px-4 py-2.5 rounded-xl border border-border hover:bg-accent hover:border-brand-purple/30 transition-all text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-brand-purple" />
            </div>
            <div className="flex gap-1 px-4 py-3 rounded-2xl bg-card border border-border">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand-purple/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pb-6">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input) }}
          className="flex gap-2 p-2 rounded-2xl border border-border bg-card shadow-sm">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about your store…"
            disabled={loading}
            className="flex-1 bg-transparent text-sm px-2 focus:outline-none placeholder:text-muted-foreground/50"
          />
          <Button type="submit" disabled={!input.trim() || loading} size="sm"
            className="h-9 w-9 p-0 rounded-xl flex-shrink-0">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Powered by Lummy Agent OS · Recommendations require your approval
        </p>
      </div>
    </div>
  )
}
