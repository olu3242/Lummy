import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { BRAND } from "@/config/branding"

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-midnight flex flex-col">
      {/* Minimal nav */}
      <header className="flex h-16 items-center px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src={BRAND.logo} alt={BRAND.name} width={32} height={32} className="h-8 w-8 rounded-xl" priority />
          <span className="font-display text-xl font-bold text-white">{BRAND.name}</span>
        </Link>
      </header>

      {children}
    </div>
  )
}
