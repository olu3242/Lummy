import type { Metadata } from "next"
import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Lummy — Creator Commerce OS for Africa",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-midnight flex flex-col">
      {/* Minimal nav */}
      <header className="flex h-16 items-center px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-display text-xl font-bold text-white">Lummy</span>
        </Link>
      </header>

      {children}
    </div>
  )
}
