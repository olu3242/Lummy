"use client"

import * as React from "react"
import Link from "next/link"
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const supabase = React.useMemo(() => createClient(), [])
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [error, setError] = React.useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage("Password updated. Redirecting to your dashboard...")
    window.location.href = "/dashboard"
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Reset password</h1>
          <p className="mt-1 text-sm text-white/50">Enter a new password for your Lummy account.</p>
        </div>

        {error ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-brand-coral/20 bg-brand-coral/10 p-3 text-xs font-medium text-brand-coral">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-brand-green/20 bg-brand-green/10 p-3 text-xs font-medium text-brand-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {message}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-white/70">New password</Label>
          <Input
            id="new-password"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            icon={<Lock className="h-4 w-4" />}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand-purple"
            placeholder="Min. 8 characters"
          />
        </div>

        <LoadingButton type="submit" size="lg" className="w-full" isLoading={loading} loadingText="Updating password...">
          Update password
          <ArrowRight className="h-4 w-4" />
        </LoadingButton>

        <p className="text-center text-xs text-white/30">
          Remembered it? <Link href="/login" className="text-brand-purple hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}
