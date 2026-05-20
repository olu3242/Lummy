import type { Metadata } from "next"
import Link from "next/link"
import { LummyLogo } from "@/components/brand/lummy-logo"

export const metadata: Metadata = {
  title: "Lummy — Creator Commerce OS for Africa",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-midnight flex flex-col">
      {/* Minimal nav */}
      <header className="flex h-16 items-center px-6 lg:px-12">
        <Link href="/" className="text-white group">
          <LummyLogo />
        </Link>
      </header>

      {children}
    </div>
  )
}
