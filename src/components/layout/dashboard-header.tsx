"use client"

import * as React from "react"
import Link from "next/link"

import { LogOut, Menu, Search, Store } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { NotificationCenter } from "@/components/dashboard/notification-center"

interface DashboardHeaderProps {
  onMenuClick: () => void
  title?: string
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
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications — real-time from DB */}
        <NotificationCenter />

        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>

        {/* Avatar */}
        <Link href="/dashboard/settings" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple ring-2 ring-border group-hover:ring-brand-purple/40 transition-all">
            <Store className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </header>
  )
}
