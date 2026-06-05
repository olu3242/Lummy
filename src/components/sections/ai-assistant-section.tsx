"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Sparkles, Zap, ArrowRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const aiExamples = [
  {
    prompt: "Write a caption for my new Ankara dress drop 🎉",
    response:
      "🔥 NEW DROP ALERT!\n\nThis Ankara Print Dress just landed and she's everything. Bold. Elegant. Timeless. ✨\n\nSizes S–XL available now. Link in bio 👆 or tap below to order via WhatsApp. Don't sleep — last drop sold out in 48 hrs 🏃🏾‍♀️\n\n#LummyStore #AnkaraFashion #HandmadeWithLove",
    tag: "Caption Generator",
  },
  {
    prompt: "Suggest a price for my handmade beaded necklaces",
    response:
      "Based on your niche (handmade jewellery), follower count (21k), and market data:\n\n💡 Recommended pricing:\n• Basic set: $18–$24\n• Premium set: $32–$45\n• Custom order: $55–$80\n\nYour audience will pay for authenticity. Lead with the story behind each piece 🪡",
    tag: "Pricing Advisor",
  },
  {
    prompt: "Write a WhatsApp reply for someone asking about delivery",
    response:
      "Hi! 👋 Thanks for ordering from [Your Store Name]!\n\nDelivery details:\n📍 Local: 1–2 business days\n🚚 Nationwide: 3–5 business days\n💳 Multiple payment methods accepted\n\nWe'll send you a tracking link once dispatched 📦",
    tag: "Reply Template",
  },
]

const CHARS_PER_TICK = 3
const TICK_MS = 14
const DOTS_DELAY = 650
const IDLE_DURATION = 4200

export function AIAssistantSection() {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [displayedText, setDisplayedText] = React.useState("")
  const [phase, setPhase] = React.useState<"dots" | "typing" | "idle">("dots")
  const [hovered, setHovered] = React.useState(false)

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  React.useEffect(() => {
    clearAll()
    setDisplayedText("")
    setPhase("dots")

    timerRef.current = setTimeout(() => {
      setPhase("typing")
      const full = aiExamples[activeIndex].response
      let i = 0
      intervalRef.current = setInterval(() => {
        i = Math.min(i + CHARS_PER_TICK, full.length)
        setDisplayedText(full.slice(0, i))
        if (i >= full.length) {
          clearInterval(intervalRef.current!)
          setPhase("idle")
        }
      }, TICK_MS)
    }, DOTS_DELAY)

    return clearAll
  }, [activeIndex])

  // Auto-cycle when idle and not hovered
  React.useEffect(() => {
    if (phase !== "idle" || hovered) return
    timerRef.current = setTimeout(() => {
      setActiveIndex(i => (i + 1) % aiExamples.length)
    }, IDLE_DURATION)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, hovered])

  const selectTab = (i: number) => {
    if (i === activeIndex) return
    clearAll()
    setActiveIndex(i)
  }

  const active = aiExamples[activeIndex]

  return (
    <section id="ai" className="section-padding bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-indigo/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative container">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Badge variant="brand-glow" size="lg">
                <Bot className="w-3.5 h-3.5" />
                Powered by Claude AI
              </Badge>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Your AI growth partner
              <br />
              <span className="gradient-text">that never sleeps.</span>
            </h2>

            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Lummy&apos;s AI assistant — built on Anthropic&apos;s Claude — knows your niche, speaks your voice, and helps you sell more every single day.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Sparkles, title: "Captions & copy", desc: "Platform-ready posts for Instagram, TikTok, Twitter — in your voice." },
                { icon: Bot, title: "Product descriptions", desc: "Compelling, benefit-led descriptions that convert browsers into buyers." },
                { icon: Zap, title: "Campaign strategy", desc: "Full campaign plans: timing, copy, hashtags, WhatsApp broadcast templates." },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex gap-3">
                    <div className="mt-0.5 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-purple/10 border border-brand-purple/20">
                      <Icon className="w-4 h-4 text-brand-purple" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link href="/signup">
              <Button size="lg" className="mt-8 group">
                Try AI Assistant Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Right: Chat UI */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="flex-1 w-full max-w-[480px]"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Tab selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
              {aiExamples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => selectTab(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    activeIndex === i
                      ? "bg-brand-purple text-white shadow-brand-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ex.tag}
                </button>
              ))}
            </div>

            {/* Chat window */}
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-glass">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Lummy AI</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                    Active
                  </p>
                </div>
                <button
                  onClick={() => selectTab((activeIndex + 1) % aiExamples.length)}
                  className="ml-auto p-1.5 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Next example"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Chat body */}
              <div className="p-4 space-y-4 min-h-[320px]">
                {/* User message */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`user-${activeIndex}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-purple/10 border border-brand-purple/20 px-3.5 py-2.5">
                      <p className="text-sm text-foreground">{active.prompt}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* AI response */}
                <motion.div
                  key={`ai-${activeIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.25 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted border border-border px-3.5 py-3 min-h-[60px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3 h-3 text-brand-purple" />
                      <span className="text-[10px] font-semibold text-brand-purple">Lummy AI</span>
                    </div>

                    {/* Typing dots */}
                    {phase === "dots" && (
                      <div className="flex items-center gap-1.5 py-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-brand-purple/50 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Streamed text */}
                    {(phase === "typing" || phase === "idle") && (
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                        {displayedText}
                        {phase === "typing" && (
                          <span className="inline-block w-0.5 h-4 bg-brand-purple ml-0.5 animate-pulse align-middle" />
                        )}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-background border border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Ask Lummy AI anything...</p>
                </div>
                <button className="h-8 w-8 rounded-xl bg-brand-purple flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Auto-cycle indicator */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {aiExamples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => selectTab(i)}
                  className={`rounded-full transition-all duration-300 ${
                    activeIndex === i ? "w-5 h-1.5 bg-brand-purple" : "w-1.5 h-1.5 bg-brand-purple/20"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
