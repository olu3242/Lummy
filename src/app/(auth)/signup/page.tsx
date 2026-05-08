"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, AtSign, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut", delay },
})

const perks = [
  "Free storefront, forever",
  "WhatsApp order flow in 5 minutes",
  "AI captions & product descriptions",
  "Paystack payments, zero setup fee",
  "Analytics dashboard from day one",
]

export default function SignupPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [step, setStep] = React.useState<"details" | "done">("details")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep("done")
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    }, 1400)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Perks panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#080815] items-center justify-center p-12">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-purple/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-brand-coral/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        <div className="relative z-10 max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-purple mb-4">
            What you get — free
          </p>
          <h2 className="font-display text-2xl font-bold text-white mb-8 leading-snug">
            Everything you need to
            <br />
            <span className="gradient-text">start selling today.</span>
          </h2>

          <ul className="space-y-4">
            {perks.map((perk, i) => (
              <motion.li
                key={perk}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
                <span className="text-sm text-white/70">{perk}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-10 glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-xs font-bold text-brand-purple">
                C
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Chioma, Food Creator</p>
                <p className="text-white/40 text-[10px]">Joined 3 months ago</p>
              </div>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">
              &ldquo;Set up my store in 10 minutes. Made my first ₦50,000 that same evening.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {step === "done" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10 border border-brand-green/20 mb-4">
                <CheckCircle2 className="h-8 w-8 text-brand-green" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">You&apos;re in! 🎉</h2>
              <p className="text-sm text-white/50">Redirecting to your dashboard…</p>
            </motion.div>
          ) : (
            <>
              <motion.div {...fadeUp(0.05)}>
                <h1 className="font-display text-2xl font-extrabold text-white mb-1">Create your store</h1>
                <p className="text-sm text-white/50 mb-8">
                  Already have an account?{" "}
                  <Link href="/login" className="text-brand-purple hover:text-brand-purple/80 font-semibold transition-colors">
                    Log in
                  </Link>
                </p>
              </motion.div>

              <motion.form {...fadeUp(0.1)} onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-white/70">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Sade Okoye"
                    icon={<User className="h-4 w-4" />}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple focus-visible:border-brand-purple/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="handle" className="text-white/70">
                    Store handle
                    <span className="ml-1 text-white/30 font-normal">(your store URL)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">
                      lummy.co/
                    </span>
                    <Input
                      id="handle"
                      type="text"
                      placeholder="sade.styles"
                      icon={<AtSign className="h-4 w-4" />}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple focus-visible:border-brand-purple/50 pl-[88px]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-white/70">Email address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    icon={<Mail className="h-4 w-4" />}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple focus-visible:border-brand-purple/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-white/70">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      icon={<Lock className="h-4 w-4" />}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple focus-visible:border-brand-purple/50 pr-10"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating your store…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Free Store
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </motion.form>

              <motion.p {...fadeUp(0.25)} className="mt-6 text-center text-xs text-white/25">
                By signing up, you agree to our{" "}
                <Link href="#" className="text-white/40 hover:text-white/60 underline">Terms</Link>
                {" & "}
                <Link href="#" className="text-white/40 hover:text-white/60 underline">Privacy Policy</Link>
              </motion.p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
