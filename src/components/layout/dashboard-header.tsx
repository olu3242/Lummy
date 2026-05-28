"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, Search, LogOut, User } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { createClient } from "@/lib/supabase/client"

interface DashboardHeaderProps {
  onMenuClick: () => void
  title?: string
}

function UserAvatarMenu() {
  const router = useRouter()
  const [user, setUser] = React.useState<{ name: string; email: string; avatarUrl: string | null } | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? data.user.email ?? "Creator",
          email: data.user.email ?? "",
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        })
      }
    })
  }, [])

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
  }

  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?"

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setMenuOpen(v => !v)}
        className="flex items-center gap-2 group focus:outline-none"
        aria-label="Account menu"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-brand-purple/40 transition-all flex items-center justify-center bg-brand-purple/20">
          {user?.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" unoptimized />
          ) : (
            <span className="text-xs font-bold text-brand-purple">{initials}</span>
          )}
        </div>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold truncate">{user?.name ?? "Creator"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
          </div>
          <div className="p-1">
            <Link
              href="/dashboard/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors"
            >
              <User className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-brand-coral hover:bg-brand-coral/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardHeader({ onMenuClick, title }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title (mobile/desktop) */}
      {title && (
        <h1 className="font-display text-base font-bold lg:hidden">{title}</h1>
      )}

      {/* Search / Cmd+K trigger — desktop */}
      <button
        onClick={() => {
          const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
          document.dispatchEvent(event)
        }}
        className="hidden lg:flex flex-1 max-w-xs items-center gap-2 h-9 px-3 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="flex items-center gap-0.5 text-[10px] border border-border rounded px-1.5 py-0.5 bg-background">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <NotificationCenter />
        <UserAvatarMenu />
      </div>
    </header>
  )
}
