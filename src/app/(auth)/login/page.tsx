"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, ArrowRight, MessageCircle, TrendingUp, ShoppingBag, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { images } from "@/config/images"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut", delay },
})

const MOCK_EMAIL = "sade@sadeboutique.com"

export default function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [shakeKey, setShakeKey] = React.useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      if (email.toLowerCase() !== MOCK_EMAIL) {
        setError("Incorrect email or password. Please try again.")
        setShakeKey(k => k + 1)
        return
      }
      window.location.href = "/dashboard"
    }, 1200)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Visual panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#080815] items-center justify-center p-12">
        {/* Gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-purple/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-brand-indigo/15 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        <div className="relative z-10 max-w-sm text-center">
          {/* Creator collage */}
          <div className="relative mx-auto w-48 h-48 mb-10">
            {[images.creators.sade, images.creators.chioma, images.creators.amaka].map((src, i) => {
              const positions = [
                "top-0 left-0 w-24 h-24",
                "top-0 right-0 w-20 h-20",
                "bottom-0 left-1/2 -translate-x-1/2 w-22 h-22",
              ]
              return (
                <div
                  key={i}
                  className={`absolute ${positions[i]} rounded-2xl overflow-hidden border-2 border-white/10 shadow-glass-dark`}
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <Image src={src} alt="Creator" fill className="object-cover" unoptimized />
                </div>
              )
            })}
            {/* Floating stat */}
            <div className="absolute -bottom-4 -right-4 glass-card rounded-2xl px-3 py-2 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-brand-green" />
              <span className="text-white text-xs font-bold">+₦847k</span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Welcome back,
            <br />
            <span className="gradient-text">Creator.</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Your store kept making sales while you were away. Log in to see your latest orders, revenue, and AI insights.
          </p>

          {/* Mini stats */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: ShoppingBag, label: "Orders", value: "1,234", color: "text-brand-purple" },
              { icon: TrendingUp, label: "Revenue", value: "₦847k", color: "text-brand-green" },
              { icon: MessageCircle, label: "WhatsApp", value: "58%", color: "text-[#25D366]" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass-card rounded-2xl p-3 text-center">
                <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
                <p className="text-white text-xs font-bold">{value}</p>
                <p className="text-white/40 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <motion.div {...fadeUp(0.05)}>
            <h1 className="font-display text-2xl font-extrabold text-white mb-1">Log in</h1>
            <p className="text-sm text-white/50 mb-8">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-brand-purple hover:text-brand-purple/80 font-semibold transition-colors">
                Sign up free
              </Link>
            </p>
          </motion.div>

          <motion.form
            key={shakeKey}
            {...fadeUp(0.1)}
            animate={shakeKey > 0
              ? { x: [0, -10, 10, -8, 8, -4, 4, 0], opacity: 1, y: 0 }
              : { opacity: 1, y: 0 }}
            transition={shakeKey > 0 ? { duration: 0.45 } : { duration: 0.5, ease: "easeOut", delay: 0.1 }}
            onSubmit={handleSubmit} className="space-y-4">

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-coral/10 border border-brand-coral/20 text-xs text-brand-coral font-medium">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError("") }}
                icon={<Mail className="h-4 w-4" />}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple focus-visible:border-brand-purple/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/70">Password</Label>
                <Link href="#" className="text-xs text-brand-purple hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple focus-visible:border-brand-purple/50 pr-10"
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

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Log in
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </motion.form>

          {/* Divider */}
          <motion.div {...fadeUp(0.2)} className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-brand-midnight px-3 text-white/30">or continue with</span>
            </div>
          </motion.div>

          {/* Social login (placeholder) */}
          <motion.button
            {...fadeUp(0.25)}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <motion.p {...fadeUp(0.3)} className="mt-6 text-center text-xs text-white/25">
            By logging in, you agree to our{" "}
            <Link href="#" className="text-white/40 hover:text-white/60 underline">Terms</Link>
            {" "}and{" "}
            <Link href="#" className="text-white/40 hover:text-white/60 underline">Privacy Policy</Link>
          </motion.p>
        </div>
      </div>
    </div>
  )
}
