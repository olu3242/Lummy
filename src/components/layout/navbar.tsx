"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Menu, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { navItems } from "@/data/mock"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  const { scrollY } = useScroll()
  const navBg = useTransform(scrollY, [0, 80], ["rgba(8,8,21,0)", "rgba(8,8,21,0.92)"])

  React.useEffect(() => {
    const unsub = scrollY.on("change", (v) => setScrolled(v > 40))
    return unsub
  }, [scrollY])

  React.useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  return (
    <>
      <motion.header
        style={{ backgroundColor: navBg }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled && "backdrop-blur-xl border-b border-white/5"
        )}
      >
        <nav className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo shadow-brand-sm group-hover:shadow-brand transition-shadow duration-300">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Lummy
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle className="text-white/60 hover:text-white hover:bg-white/5" />
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/5" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" className="shadow-brand-sm" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </div>

          {/* Mobile: toggle + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle className="text-white/60 hover:text-white hover:bg-white/5" />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed inset-0 z-40 flex flex-col bg-brand-midnight pt-16"
        >
          <div className="flex flex-col gap-1 p-6">
            {navItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-lg font-medium text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              <Button variant="outline-white" size="lg" className="w-full" asChild>
                <Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
              </Button>
              <Button size="lg" className="w-full" asChild>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
