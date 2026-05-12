"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCheck, MessageCircle, ShoppingCart, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const messages = [
  {
    from: "customer",
    text: "Hi! I saw the Ankara dress on your store 👀 Is it available in size M?",
    time: "10:31 AM",
  },
  {
    from: "auto",
    text: "Hey! Yes, the Ankara Print Dress is available in size M 🎉\n\nHere's your order summary:\n\n🛍 Ankara Print Dress (Size M)\n💰 ₦25,000\n📦 Delivery: 2–3 days\n\nTap below to confirm your order and pay securely online 👇",
    time: "10:31 AM",
    isBot: true,
  },
  {
    from: "customer",
    text: "Perfect! I'll pay now 🙌",
    time: "10:33 AM",
  },
  {
    from: "system",
    text: "✅ Payment confirmed · ₦25,000 received",
    time: "10:34 AM",
  },
]

// Delays (ms) at which each message becomes visible
const REVEAL_DELAYS = [400, 2600, 3700, 5200]
// Typing indicator shows between message 0→1 and 2→3
const TYPING_ON = [900, 4100]
const TYPING_OFF = [2500, 5100]
const LOOP_RESET = 8000

export function WhatsAppSection() {
  const [visibleCount, setVisibleCount] = React.useState(0)
  const [showTyping, setShowTyping] = React.useState(false)
  const [loopKey, setLoopKey] = React.useState(0)

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const t = (fn: () => void, delay: number) => { timers.push(setTimeout(fn, delay)) }

    REVEAL_DELAYS.forEach((delay, i) => t(() => setVisibleCount(i + 1), delay))
    TYPING_ON.forEach(delay => t(() => setShowTyping(true), delay))
    TYPING_OFF.forEach(delay => t(() => setShowTyping(false), delay))
    t(() => {
      setVisibleCount(0)
      setShowTyping(false)
      setLoopKey(k => k + 1)
    }, LOOP_RESET)

    return () => timers.forEach(clearTimeout)
  }, [loopKey])

  return (
    <section id="whatsapp" className="section-padding bg-background overflow-hidden">
      <div className="container">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Chat mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-1 flex justify-center"
          >
            <div className="relative w-full max-w-[340px]">
              {/* Glow */}
              <div className="absolute inset-0 bg-[#25D366]/10 blur-[80px] rounded-3xl" />

              {/* Chat window */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-glass-dark bg-[#0b1014]">
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34] border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-indigo flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">Sade&apos;s Store</p>
                    <p className="text-white/40 text-[10px]">online · via Lummy</p>
                  </div>
                  <MessageCircle className="ml-auto h-4 w-4 text-[#25D366]" />
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3 min-h-[360px]">
                  <AnimatePresence>
                    {messages.map((msg, i) => {
                      if (i >= visibleCount) return null
                      return (
                        <motion.div
                          key={`${loopKey}-${i}`}
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          {msg.from === "system" ? (
                            <div className="flex justify-center">
                              <span className="px-3 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-[10px] font-semibold flex items-center gap-1.5">
                                <CheckCheck className="w-3 h-3" />
                                {msg.text}
                              </span>
                            </div>
                          ) : msg.from === "customer" ? (
                            <div className="flex justify-end">
                              <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[#005c4b] px-3 py-2">
                                <p className="text-white text-[11px] leading-relaxed">{msg.text}</p>
                                <p className="text-white/30 text-[9px] mt-1 text-right">{msg.time}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#1f2c34] px-3 py-2 space-y-2">
                                {msg.isBot && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <div className="w-3 h-3 rounded-full bg-brand-purple/30 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                                    </div>
                                    <span className="text-brand-purple/70 text-[9px] font-medium">Lummy Auto-reply</span>
                                  </div>
                                )}
                                <p className="text-white text-[11px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                                {msg.isBot && (
                                  <div className="mt-2 w-full rounded-xl bg-[#25D366] flex items-center justify-center gap-1.5 py-2">
                                    <ShoppingCart className="w-3 h-3 text-white" />
                                    <span className="text-white text-[10px] font-semibold">Confirm Order & Pay</span>
                                  </div>
                                )}
                                <p className="text-white/30 text-[9px] mt-1 flex items-center gap-1">
                                  {msg.time}
                                  {msg.isBot && <CheckCheck className="w-2.5 h-2.5 text-[#25D366]" />}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}

                    {/* Typing indicator */}
                    {showTyping && (
                      <motion.div
                        key={`typing-${loopKey}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-start"
                      >
                        <div className="rounded-2xl rounded-tl-sm bg-[#1f2c34] px-4 py-3 flex items-center gap-1.5">
                          {[0, 1, 2].map(i => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#1f2c34] border-t border-white/5">
                  <div className="flex-1 rounded-full bg-[#2a3942] px-3 py-2">
                    <p className="text-white/20 text-[10px]">Type a message...</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Copy */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-1"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-[#25D366] mb-4">
              WhatsApp Commerce
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Turn every DM
              <br />
              <span className="gradient-text">into a sale.</span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
              African customers buy where they trust — WhatsApp. Lummy automatically generates pre-filled order messages so customers can buy with one tap, and you receive every order neatly.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: MessageCircle,
                  color: "text-[#25D366]",
                  bg: "bg-[#25D366]/10",
                  title: "Auto-generated order messages",
                  desc: "Each product creates a ready-to-send WhatsApp message with product, price, and order details.",
                },
                {
                  icon: CheckCheck,
                  color: "text-brand-purple",
                  bg: "bg-brand-purple/10",
                  title: "Smart order tracking",
                  desc: "Every WhatsApp click is tracked. See who ordered, what they ordered, and follow up with one tap.",
                },
                {
                  icon: ShoppingCart,
                  color: "text-brand-coral",
                  bg: "bg-brand-coral/10",
                  title: "Instant payment links",
                  desc: "Attach a Paystack payment link to every order. Customers pay online, you get notified instantly.",
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex gap-4">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8">
              <Button variant="whatsapp" size="lg" className="gap-2">
                <MessageCircle className="h-5 w-5 fill-white" />
                Set Up WhatsApp Commerce
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
