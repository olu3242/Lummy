"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Store,
  CheckCheck,
  Eye,
  EyeOff,
  Upload,
  Smartphone,
  MessageCircle,
  Zap,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useUpload } from "@/hooks/use-upload"

type SettingsSection = "profile" | "store" | "notifications" | "payments" | "security"

const navItems: { id: SettingsSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: "profile", label: "Profile", icon: User, description: "Personal info, avatar" },
  { id: "store", label: "Store", icon: Store, description: "Store details, handle" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & reminders" },
  { id: "payments", label: "Payments", icon: CreditCard, description: "Bank account, payouts" },
  { id: "security", label: "Security", icon: Shield, description: "Password, 2FA" },
]

function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
      <Button variant="outline" size="sm" className="h-9 text-xs">Discard</Button>
      <Button size="sm" className="h-9 text-xs gap-1.5" onClick={onSave}>
        {saved ? <><CheckCheck className="h-3.5 w-3.5" />Saved!</> : "Save changes"}
      </Button>
    </div>
  )
}


function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
        checked ? "bg-brand-purple" : "bg-muted-foreground/30"
      )}
    >
      <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  )
}

const NOTIF_KEY = "lummy_settings_notifications"

type ProfileForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  bio: string
  location: string
  avatarUrl: string
}

type StoreForm = {
  storeName: string
  handle: string
  instagram: string
  twitter: string
  tiktok: string
}

type AccountConfigResponse = {
  user?: { email?: string | null }
  profile?: {
    full_name?: string | null
    email?: string | null
    phone?: string | null
    avatar_url?: string | null
  } | null
  organization?: { name?: string | null } | null
  storefront?: {
    handle?: string | null
    bio?: string | null
    social_links?: Record<string, string | null> | null
  } | null
}

const emptyProfile: ProfileForm = { firstName: "", lastName: "", email: "", phone: "", bio: "", location: "", avatarUrl: "" }
const emptyStore: StoreForm = { storeName: "", handle: "", instagram: "", twitter: "", tiktok: "" }

function splitName(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") }
}

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback } catch { return fallback }
}

function saveLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = React.useState<T>(fallback)

  React.useEffect(() => {
    setValue(loadLS(key, fallback))
  }, [fallback, key])

  return [value, setValue] as const
}

function ProfileSection() {
  const [form, setForm] = React.useState<ProfileForm>(emptyProfile)
  const [saved, setSaved] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)
  const { upload: uploadAvatar, uploading: avatarUploading } = useUpload({
    type: "avatar",
    onSuccess: (url) => {
      setForm(f => ({ ...f, avatarUrl: url }))
      toast({ title: "Photo updated", variant: "success" })
    },
    onError: (msg) => toast({ title: "Upload failed", description: msg, variant: "error" }),
  })

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/account/config")
      .then(async (res) => {
        const payload = await res.json() as AccountConfigResponse
        if (!res.ok) throw new Error("Failed to load profile")
        return payload
      })
      .then((payload) => {
        if (cancelled) return
        const name = splitName(payload.profile?.full_name)
        setForm({
          firstName: name.firstName,
          lastName: name.lastName,
          email: payload.profile?.email ?? payload.user?.email ?? "",
          phone: payload.profile?.phone ?? "",
          bio: payload.storefront?.bio ?? "",
          location: (payload.profile as Record<string, unknown> | null)?.location as string ?? "",
          avatarUrl: payload.profile?.avatar_url ?? "",
        })
      })
      .catch((error) => toast({ title: "Profile load failed", description: error instanceof Error ? error.message : "Failed to load profile", variant: "error" }))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const save = async () => {
    try {
      const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ").trim()
      const res = await fetch("/api/account/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { full_name: fullName, phone: form.phone, avatar_url: form.avatarUrl, location: form.location },
          storefront: { bio: form.bio },
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || "Failed to save profile")
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast({ title: "Profile saved", description: "Your profile has been updated.", variant: "success" })
    } catch (error) {
      toast({ title: "Profile save failed", description: error instanceof Error ? error.message : "Failed to save profile", variant: "error" })
    }
  }

  const field = (key: keyof ProfileForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-lg">Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your personal information visible to customers</p>
      </div>

      {/* Avatar upload */}
      <div className="flex items-center gap-4">
        <div
          className="relative w-16 h-16 rounded-2xl overflow-hidden bg-brand-purple/10 flex items-center justify-center text-2xl font-bold text-brand-purple flex-shrink-0 cursor-pointer group"
          onClick={() => avatarInputRef.current?.click()}
        >
          {form.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{form.firstName.charAt(0) || "C"}</span>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {avatarUploading
              ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Upload className="h-4 w-4 text-white" />}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Profile photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">JPG or PNG · Max 10 MB</p>
          <button
            className="mt-1.5 text-xs text-brand-purple font-semibold hover:underline"
            onClick={() => avatarInputRef.current?.click()}
          >
            Upload photo
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5">First name</label>
          <input {...field("firstName")} className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">Last name</label>
          <input {...field("lastName")} className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Email</label>
        <input {...field("email")} disabled={loading} className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Phone / WhatsApp</label>
        <div className="flex gap-2">
          <div className="flex items-center px-3 h-10 rounded-xl border border-border bg-muted text-sm text-muted-foreground flex-shrink-0 gap-1.5">
            <Smartphone className="h-3.5 w-3.5" />
            +234
          </div>
          <input {...field("phone")} className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Bio</label>
        <textarea {...field("bio")} rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Location</label>
        <input {...field("location")} className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
      </div>

      <SaveBar onSave={save} saved={saved} />
    </div>
  )
}

function StoreSection() {
  const [form, setForm] = React.useState<StoreForm>(emptyStore)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/account/config")
      .then(async (res) => {
        const payload = await res.json() as AccountConfigResponse
        if (!res.ok) throw new Error("Failed to load store settings")
        return payload
      })
      .then((payload) => {
        if (cancelled) return
        const social = payload.storefront?.social_links ?? {}
        setForm({
          storeName: payload.organization?.name ?? "",
          handle: payload.storefront?.handle ?? "",
          instagram: social.instagram ?? "",
          twitter: social.twitter ?? "",
          tiktok: social.tiktok ?? "",
        })
      })
      .catch((error) => toast({ title: "Store settings load failed", description: error instanceof Error ? error.message : "Failed to load store settings", variant: "error" }))
    return () => { cancelled = true }
  }, [])

  const save = async () => {
    try {
      const res = await fetch('/api/account/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: { name: form.storeName },
          storefront: { handle: form.handle, social_links: { instagram: form.instagram, twitter: form.twitter, tiktok: form.tiktok } },
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to save storefront settings')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast({ title: "Store settings saved", description: "Your store details have been updated.", variant: "success" })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save storefront settings'
      toast({ title: 'Store save failed', description: message, variant: 'error' })
    }
  }

  const field = (key: keyof StoreForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-lg">Store settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Customise how your public store appears</p>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Store name</label>
        <input {...field("storeName")} className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Store handle</label>
        <div className="flex items-center gap-0">
          <div className="flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-border bg-muted text-xs text-muted-foreground flex-shrink-0">
            lummy.co/
          </div>
          <input {...field("handle")} className="flex-1 h-10 px-3 rounded-r-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Your public store URL. Changing this will break existing links.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Instagram</label>
        <div className="flex items-center gap-0">
          <div className="flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-border bg-muted text-xs text-muted-foreground">@</div>
          <input {...field("instagram")} className="flex-1 h-10 px-3 rounded-r-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Twitter / X</label>
        <div className="flex items-center gap-0">
          <div className="flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-border bg-muted text-xs text-muted-foreground">@</div>
          <input {...field("twitter")} className="flex-1 h-10 px-3 rounded-r-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">TikTok</label>
        <div className="flex items-center gap-0">
          <div className="flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-border bg-muted text-xs text-muted-foreground">@</div>
          <input {...field("tiktok")} placeholder="your_handle" className="flex-1 h-10 px-3 rounded-r-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 placeholder:text-muted-foreground" />
        </div>
      </div>

      <SaveBar onSave={save} saved={saved} />
    </div>
  )
}

function NotificationsSection() {
  const defaultPrefs = React.useMemo(() => ({
    newOrder: true, orderStatus: true, newReview: true, lowStock: true,
    weeklySummary: true, aiInsights: false, marketing: false, whatsappAlerts: true, emailDigest: true,
  }), [])
  const [prefs, setPrefs] = useLocalStorageState(NOTIF_KEY, defaultPrefs)
  const [saved, setSaved] = React.useState(false)
  const save = () => { saveLS(NOTIF_KEY, prefs); setSaved(true); setTimeout(() => setSaved(false), 2500); toast({ title: "Notification preferences saved", variant: "success" }) }

  const toggle = (key: keyof typeof defaultPrefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const groups = [
    {
      title: "Order alerts",
      items: [
        { key: "newOrder" as const, label: "New order received", desc: "Get notified immediately for every new order" },
        { key: "orderStatus" as const, label: "Order status updates", desc: "When orders are confirmed, shipped or delivered" },
        { key: "lowStock" as const, label: "Low stock warnings", desc: "When a product has 5 or fewer units left" },
      ],
    },
    {
      title: "Customer activity",
      items: [
        { key: "newReview" as const, label: "New review posted", desc: "When a customer leaves a review" },
      ],
    },
    {
      title: "Insights",
      items: [
        { key: "weeklySummary" as const, label: "Weekly performance summary", desc: "Every Monday: revenue, orders, top products" },
        { key: "aiInsights" as const, label: "AI-powered growth tips", desc: "Personalised recommendations from Lummy AI" },
      ],
    },
    {
      title: "Channels",
      items: [
        { key: "whatsappAlerts" as const, label: "WhatsApp notifications", desc: "Send alerts to your WhatsApp number" },
        { key: "emailDigest" as const, label: "Email digest", desc: "Daily email summary of store activity" },
        { key: "marketing" as const, label: "Product updates & tips", desc: "New Lummy features and creator tips" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Control how and when you hear from Lummy</p>
      </div>

      {groups.map((group) => (
        <div key={group.title}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{group.title}</p>
          <div className="space-y-1">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <ToggleSwitch checked={prefs[item.key]} onChange={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <SaveBar onSave={save} saved={saved} />
    </div>
  )
}

function PaymentsSection() {
  const [saved, setSaved] = React.useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-lg">Payments</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Bank details for payouts and payment preferences</p>
      </div>

      {/* Current plan */}
      <div className="rounded-2xl border border-brand-purple/30 bg-brand-purple/5 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-purple/15 flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-brand-purple" />
          </div>
          <div>
            <p className="text-sm font-semibold">Growth Plan</p>
            <p className="text-xs text-muted-foreground">$4.00 / month · Renews Dec 1</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs">Manage plan</Button>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bank details</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Bank name</label>
            <select className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30">
              <option>Access Bank</option>
              <option>GTBank</option>
              <option>First Bank</option>
              <option>Zenith Bank</option>
              <option>UBA</option>
              <option>Opay</option>
              <option>Palmpay</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Account number</label>
            <input defaultValue="" placeholder="Enter your account number" className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Account name</label>
            <input defaultValue="" disabled placeholder="Auto-filled after verification" className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
            <p className="text-[10px] text-muted-foreground mt-1">Auto-filled after account number verification</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Payout schedule</p>
        <div className="grid grid-cols-3 gap-2">
          {["Daily", "Weekly", "Monthly"].map((opt) => (
            <button
              key={opt}
              className={cn(
                "h-10 rounded-xl border text-xs font-semibold transition-all",
                opt === "Weekly"
                  ? "bg-brand-purple text-white border-brand-purple"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Minimum payout: $5.00</p>
      </div>

      <SaveBar onSave={save} saved={saved} />
    </div>
  )
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)
  const confirmed = typed === "DELETE"

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const handleDelete = () => {
    if (!confirmed) return
    setDeleting(true)
    setTimeout(() => {
      toast({ title: "Account deletion requested", description: "You'll receive a confirmation email within 24 hours.", variant: "success" })
      onClose()
    }, 1500)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-brand-coral/30 bg-card overflow-hidden shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-coral/10 mx-auto">
            <AlertTriangle className="h-6 w-6 text-brand-coral" />
          </div>
          <div className="text-center">
            <h2 className="font-display text-lg font-extrabold">Delete your account?</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              This will permanently delete your store, all products, orders, customers, and analytics. <strong>This cannot be undone.</strong>
            </p>
          </div>
          <div className="rounded-xl bg-brand-coral/5 border border-brand-coral/20 p-3 text-xs text-brand-coral font-medium text-center">
            You will lose access immediately
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              Type <span className="font-mono text-brand-coral">DELETE</span> to confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="DELETE"
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-coral/30"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-10 text-xs" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 h-10 text-xs bg-brand-coral hover:bg-brand-coral/90 text-white gap-1.5"
              disabled={!confirmed || deleting}
              onClick={handleDelete}
            >
              {deleting ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</> : <><Trash2 className="h-3.5 w-3.5" />Delete account</>}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function SecuritySection() {
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg">Security</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Keep your account safe</p>
      </div>

      {/* Change password */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Change password</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Current password</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} placeholder="••••••••" className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
              <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">New password</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} placeholder="••••••••" className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">At least 8 characters with a number and symbol</p>
          </div>
        </div>
        <div className="mt-4">
          <Button size="sm" className="h-9 text-xs gap-1.5" onClick={save}>
            {saved ? <><CheckCheck className="h-3.5 w-3.5" />Password updated!</> : "Update password"}
          </Button>
        </div>
      </div>

      {/* 2FA */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Two-factor authentication</p>
        <div className="rounded-2xl border border-border p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-brand-green" />
            </div>
            <div>
              <p className="text-sm font-semibold">WhatsApp 2FA</p>
              <p className="text-xs text-muted-foreground">Verify logins via WhatsApp OTP</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs flex-shrink-0">Enable</Button>
        </div>
      </div>

      {/* Active sessions */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Active sessions</p>
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">Current session — signed in on this device</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Session management coming soon</p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Danger zone</p>
        <div className="rounded-2xl border border-brand-coral/20 bg-brand-coral/5 p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-brand-coral flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Delete account</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your store and all data. This cannot be undone.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowDeleteModal(true)}
            className="h-8 text-xs border-brand-coral/30 text-brand-coral hover:bg-brand-coral/10 flex-shrink-0 gap-1.5">
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
      </AnimatePresence>
    </div>
  )
}

const sectionComponents: Record<SettingsSection, React.FC> = {
  profile: ProfileSection,
  store: StoreSection,
  notifications: NotificationsSection,
  payments: PaymentsSection,
  security: SecuritySection,
}

export default function SettingsPage() {
  const [active, setActive] = React.useState<SettingsSection>("profile")
  const ActiveSection = sectionComponents[active]

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and store preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar nav */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide lg:w-52 flex-shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all whitespace-nowrap lg:whitespace-normal",
                active === item.id
                  ? "bg-brand-purple/10 text-brand-purple"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", active === item.id ? "text-brand-purple" : "text-muted-foreground")} />
              <div className="hidden lg:block text-left">
                <p className={cn("text-xs font-semibold", active === item.id ? "text-brand-purple" : "text-foreground")}>{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.description}</p>
              </div>
              <span className="text-xs font-semibold lg:hidden">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <motion.div
          key={active}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 rounded-2xl border border-border bg-card p-5 min-w-0"
        >
          <ActiveSection />
        </motion.div>
      </div>
    </div>
  )
}
