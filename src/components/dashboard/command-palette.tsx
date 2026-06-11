"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useRouter } from "next/navigation"
import {
  Search,
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Store,
  Users,
  BarChart3,
  Bot,
  Settings,
  Plus,
  ExternalLink,
  Share2,
  Sparkles,
  Package,
  ArrowRight,
  Zap,
} from "lucide-react"
import { mockProducts, mockOrders } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/globalization"

interface CommandItem {
  id: string
  group: string
  label: string
  description?: string
  icon: React.ElementType
  iconClass?: string
  action: () => void
  shortcut?: string
}

function useCommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return { open, setOpen }
}

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand-purple/20 text-brand-purple rounded-sm not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [activeIdx, setActiveIdx] = React.useState(0)
  const [storeHandle, setStoreHandle] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    fetch("/api/account/config")
      .then(async (res) => {
        const payload = await res.json() as { storefront?: { handle?: string | null } | null }
        if (!res.ok) throw new Error("Failed to load storefront")
        return payload
      })
      .then((payload) => setStoreHandle(payload.storefront?.handle ?? ""))
      .catch(() => setStoreHandle(""))
  }, [])

  React.useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const go = React.useCallback((href: string) => {
    router.push(href)
    setOpen(false)
  }, [router, setOpen])

  const baseItems: CommandItem[] = React.useMemo(() => [
    { id: "nav-home",       group: "Navigation", label: "Overview",     description: "Dashboard home",        icon: LayoutDashboard, action: () => go("/dashboard") },
    { id: "nav-products",   group: "Navigation", label: "Products",     description: "Manage your listings",  icon: ShoppingBag,     action: () => go("/dashboard/products") },
    { id: "nav-orders",     group: "Navigation", label: "Orders",       description: "View & manage orders",  icon: ClipboardList,   action: () => go("/dashboard/orders") },
    { id: "nav-store",      group: "Navigation", label: "My Store",     description: "Edit store profile",    icon: Store,           action: () => go("/dashboard/store") },
    { id: "nav-crm",        group: "Navigation", label: "Customers",    description: "CRM & segments",        icon: Users,           action: () => go("/dashboard/crm") },
    { id: "nav-analytics",  group: "Navigation", label: "Analytics",    description: "Performance charts",    icon: BarChart3,       action: () => go("/dashboard/analytics") },
    { id: "nav-ai",         group: "Navigation", label: "AI Assistant", description: "Lummy AI growth coach", icon: Bot, iconClass: "text-brand-purple", action: () => go("/dashboard/ai") },
    { id: "nav-settings",   group: "Navigation", label: "Settings",     description: "Account & store prefs", icon: Settings,        action: () => go("/dashboard/settings") },

    { id: "act-add-product",  group: "Actions", label: "Add new product",       icon: Plus,        iconClass: "text-brand-green",  action: () => { go("/dashboard/products"); } },
    { id: "act-view-store",   group: "Actions", label: "View public store",     icon: ExternalLink,iconClass: "text-brand-coral",   action: () => { if (storeHandle) window.open(`/${storeHandle}`, "_blank"); setOpen(false) } },
    { id: "act-share-store",  group: "Actions", label: "Share store link",      icon: Share2,      iconClass: "text-brand-purple",  action: () => { if (storeHandle) navigator.clipboard.writeText(`https://lummy.co/${storeHandle}`); setOpen(false) } },
    { id: "act-ai-caption",   group: "Actions", label: "Generate AI caption",   icon: Sparkles,    iconClass: "text-amber-500",     action: () => go("/dashboard/ai") },
    { id: "act-pending",      group: "Actions", label: "View pending orders",   icon: Package,     iconClass: "text-amber-500",     action: () => go("/dashboard/orders") },
  ], [go, setOpen, storeHandle])

  const productItems: CommandItem[] = React.useMemo(() =>
    mockProducts.map((p) => ({
      id: `product-${p.id}`,
      group: "Products",
      label: p.name,
      description: `${formatMoney(p.price, p.currency)} · ${p.status}`,
      icon: ShoppingBag,
      iconClass: "text-brand-purple",
      action: () => go("/dashboard/products"),
    })),
  [go])

  const orderItems: CommandItem[] = React.useMemo(() =>
    mockOrders.map((o) => ({
      id: `order-${o.id}`,
      group: "Orders",
      label: `${o.orderNumber} — ${o.customer.name}`,
      description: `${formatMoney(o.amount, o.currency)} · ${o.status}`,
      icon: ClipboardList,
      iconClass: "text-brand-coral",
      action: () => go("/dashboard/orders"),
    })),
  [go])

  const filtered = React.useMemo(() => {
    const allItems = [...baseItems, ...productItems, ...orderItems]
    if (!query.trim()) return baseItems
    const q = query.toLowerCase()
    return allItems.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q)) ||
        i.group.toLowerCase().includes(q)
    )
  }, [query, baseItems, productItems, orderItems])

  const groups = React.useMemo(() => {
    const map: Record<string, CommandItem[]> = {}
    filtered.forEach((item) => {
      if (!map[item.group]) map[item.group] = []
      map[item.group].push(item)
    })
    return map
  }, [filtered])

  const flatFiltered = filtered

  React.useEffect(() => { setActiveIdx(0) }, [query])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, flatFiltered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      flatFiltered[activeIdx]?.action()
    }
  }

  React.useEffect(() => {
    const el = listRef.current?.querySelector(`[data-active="true"]`) as HTMLElement | null
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIdx])

  let globalIdx = 0

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-card shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[5%] data-[state=open]:slide-in-from-top-[5%] overflow-hidden"
          onKeyDown={handleKey}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Search and navigate your dashboard</DialogPrimitive.Description>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, products, orders…"
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[380px] overflow-y-auto py-2 scrollbar-hide">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Zap className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No results for &quot;{query}&quot;</p>
              </div>
            ) : (
              Object.entries(groups).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  {items.map((item) => {
                    const idx = globalIdx++
                    const Icon = item.icon
                    const isActive = idx === activeIdx
                    return (
                      <button
                        key={item.id}
                        data-active={isActive}
                        onClick={item.action}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isActive ? "bg-accent" : "hover:bg-accent/50"
                        )}
                      >
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0",
                          isActive ? "bg-brand-purple/15" : "bg-muted"
                        )}>
                          <Icon className={cn("h-3.5 w-3.5", item.iconClass || "text-muted-foreground")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {highlight(item.label, query)}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {highlight(item.description, query)}
                            </p>
                          )}
                        </div>
                        {isActive && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                        {item.shortcut && (
                          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 flex-shrink-0">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="border border-border rounded px-1 py-0.5">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-border rounded px-1 py-0.5">↵</kbd> open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-border rounded px-1 py-0.5">⌘K</kbd> toggle
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
