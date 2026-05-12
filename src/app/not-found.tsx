"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Zap, ShoppingBag, LayoutDashboard, Home } from "lucide-react"

const links = [
  { label: "Go home",          href: "/",              icon: Home,            desc: "Back to the landing page" },
  { label: "Open dashboard",   href: "/dashboard",     icon: LayoutDashboard, desc: "Manage your store" },
  { label: "Browse a store",   href: "/sade.styles",   icon: ShoppingBag,     desc: "See a sample storefront" },
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-indigo shadow-brand-sm group-hover:shadow-brand transition-shadow">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="font-display text-xl font-bold">Lummy</span>
        </Link>
      </motion.div>

      {/* 404 display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative mb-6"
      >
        <p className="font-display text-[120px] sm:text-[160px] font-extrabold leading-none tracking-tight text-muted/20 select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🛍️</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-3 mb-8"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
          This page doesn&apos;t exist
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          The link you followed may be broken, or the store you&apos;re looking for may have moved.
        </p>
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="w-full max-w-sm space-y-2.5 mb-8"
      >
        {links.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.07 }}
          >
            <Link
              href={link.href}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:bg-accent hover:border-brand-purple/20 transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple/10 flex-shrink-0">
                <link.icon className="h-4 w-4 text-brand-purple" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-muted-foreground"
      >
        Lost? Email{" "}
        <a href="mailto:hello@lummy.co" className="text-brand-purple hover:underline">
          hello@lummy.co
        </a>
      </motion.p>
    </div>
  )
}
