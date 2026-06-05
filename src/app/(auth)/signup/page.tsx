"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

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

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 8) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
}

const strengthConfig = [
  null,
  { label: "Weak",   color: "bg-brand-coral",  text: "text-brand-coral"  },
  { label: "Fair",   color: "bg-amber-400",     text: "text-amber-400"   },
  { label: "Good",   color: "bg-brand-purple",  text: "text-brand-purple"},
  { label: "Strong", color: "bg-brand-green",   text: "text-brand-green" },
]

function PasswordStrength({ password }: { password: string }) {
  const s = getStrength(password)
  if (!password) return null
  const cfg = strengthConfig[s]!
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: i <= s ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
              className={cn("h-full rounded-full", i <= s ? cfg.color : "")}
            />
          </div>
        ))}
      </div>
      <p className={cn("text-[11px] font-semibold", cfg.text)}>{cfg.label} password</p>
    </div>
  )
}

// ─── Handle availability check ────────────────────────────────────────────────

type HandleStatus = "idle" | "checking" | "available" | "taken"

const RESERVED_HANDLES = ["sade", "shop", "store", "lummy", "admin"]

export default function SignupPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [step, setStep] = React.useState<"details" | "confirm-email" | "done">("details")
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [handle, setHandle] = React.useState("")
  const [handleStatus, setHandleStatus] = React.useState<HandleStatus>("idle")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const handleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = React.useMemo(() => createClient(), [])

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setErrorMessage(null)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      })
      if (oauthError) {
        setErrorMessage(oauthError.message)
        setGoogleLoading(false)
      }
    } catch {
      setErrorMessage("Google sign-up failed. Please try again.")
      setGoogleLoading(false)
    }
  }

  const onHandleChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9._-]/g, "")
    setHandle(cleaned)
    setHandleStatus("idle")
    if (handleTimerRef.current) clearTimeout(handleTimerRef.current)
    if (cleaned.length < 3) return
    setHandleStatus("checking")
    handleTimerRef.current = setTimeout(async () => {
      if (RESERVED_HANDLES.includes(cleaned)) {
        setHandleStatus("taken")
        return
      }
      const { data } = await supabase.from("storefronts").select("handle").eq("handle", cleaned).limit(1)
      setHandleStatus((data?.length ?? 0) > 0 ? "taken" : "available")
    }, 650)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (handleStatus === "taken") return
    setIsLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, handle },
        // PKCE callback URL — Supabase appends ?code=... for exchange
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    })
    if (error) {
      setIsLoading(false)
      setErrorMessage(error.message)
      return
    }
    // If session exists → auto-confirmed (email confirmation disabled)
    if (data.session) {
      setStep("done")
      window.location.href = "/onboarding"
      return
    }
    // No session → email confirmation required; show holding screen
    setIsLoading(false)
    setStep("confirm-email")
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Perks panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#080815] items-center justify-center p-12">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-purple/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-brand-coral/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-purple mb-4">What you get — free</p>
          <h2 className="font-display text-2xl font-bold text-white mb-8 leading-snug">
            Everything you need to<br />
            <span className="gradient-text">start selling today.</span>
          </h2>
          <ul className="space-y-4">
            {perks.map((perk, i) => (
              <motion.li key={perk} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
                <span className="text-sm text-white/70">{perk}</span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-10 glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-xs font-bold text-brand-purple">C</div>
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
          <AnimatePresence mode="wait">
            {step === "done" ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                  className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-green/15 border-2 border-brand-green/30 mb-5">
                  <CheckCircle2 className="h-10 w-10 text-brand-green" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">You&apos;re in! 🎉</h2>
                  <p className="text-sm text-white/50">Taking you to your store setup…</p>
                </motion.div>
              </motion.div>
            ) : step === "confirm-email" ? (
              <motion.div key="confirm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-purple/15 border-2 border-brand-purple/30 mb-5">
                  <Mail className="h-10 w-10 text-brand-purple" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-sm text-white/50 leading-relaxed mb-4">
                  We sent a confirmation link to <span className="text-white font-semibold">{email}</span>.
                  Click it to activate your account.
                </p>
                <p className="text-xs text-white/30">
                  Didn&apos;t get it? Check your spam folder or{" "}
                  <button
                    onClick={() => setStep("details")}
                    className="text-brand-purple hover:underline"
                  >
                    try again
                  </button>
                  .
                </p>
              </motion.div>
            ) : (
              <motion.div key="form">
                <motion.div {...fadeUp(0.05)}>
                  <h1 className="font-display text-2xl font-extrabold text-white mb-1">Create your store</h1>
                  <p className="text-sm text-white/50 mb-8">
                    Already have an account?{" "}
                    <Link href="/login" className="text-brand-purple hover:text-brand-purple/80 font-semibold transition-colors">Log in</Link>
                  </p>
                </motion.div>

                <motion.form {...fadeUp(0.1)} onSubmit={handleSubmit} className="space-y-4">
                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-coral/10 border border-brand-coral/20 text-xs text-brand-coral font-medium">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-white/70">Full name</Label>
                    <Input id="name" type="text" placeholder="Sade Okoye" icon={<User className="h-4 w-4" />}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple" required
                      value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>

                  {/* Handle */}
                  <div className="space-y-1.5">
                    <Label htmlFor="handle" className="text-white/70">
                      Store handle <span className="text-white/30 font-normal">(your store URL)</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none z-10">lummy.co/</span>
                      <input
                        id="handle" value={handle} onChange={e => onHandleChange(e.target.value)}
                        placeholder="sade.styles" required
                        className="w-full h-11 pl-[88px] pr-9 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-purple/60"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {handleStatus === "checking"   && <Loader2 className="h-4 w-4 text-white/30 animate-spin" />}
                        {handleStatus === "available"  && <Check className="h-4 w-4 text-brand-green" />}
                        {handleStatus === "taken"      && <X className="h-4 w-4 text-brand-coral" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {handleStatus === "available" && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="text-[11px] text-brand-green flex items-center gap-1">
                          <Check className="h-3 w-3" /> lummy.co/{handle} is available
                        </motion.p>
                      )}
                      {handleStatus === "taken" && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="text-[11px] text-brand-coral flex items-center gap-1">
                          <X className="h-3 w-3" /> This handle is taken. Try another.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-white/70">Email address</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple" required
                      value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>

                  {/* Password with strength */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-white/70">Password</Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters" icon={<Lock className="h-4 w-4" />}
                        value={password} onChange={e => setPassword(e.target.value)}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple pr-10"
                        minLength={8} required />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  <Button type="submit" size="lg" className="w-full mt-2"
                    disabled={isLoading || handleStatus === "taken" || handleStatus === "checking"}>
                    {isLoading
                      ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating your store…</span>
                      : <span className="flex items-center gap-2">Create Free Store <ArrowRight className="h-4 w-4" /></span>}
                  </Button>
                </motion.form>
                {errorMessage ? <p className="mt-3 text-xs text-brand-coral">{errorMessage}</p> : null}

                {/* Divider */}
                <motion.div {...fadeUp(0.28)} className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-brand-midnight px-3 text-white/30">or sign up with</span>
                  </div>
                </motion.div>

                {/* Google OAuth */}
                <motion.button
                  {...fadeUp(0.3)}
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading || isLoading}
                  className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/[0.08] hover:text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
                </motion.button>

                <motion.p {...fadeUp(0.32)} className="mt-5 text-center text-xs text-white/25">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-white/40 hover:text-white/60 underline">Terms</Link>
                  {" & "}
                  <Link href="/privacy" className="text-white/40 hover:text-white/60 underline">Privacy Policy</Link>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
