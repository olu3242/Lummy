import type { Metadata } from "next"
import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Lummy Store",
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}

      {/* Powered-by footer */}
      <div className="py-6 text-center border-t border-border">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          Powered by
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <div className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-brand-purple to-brand-indigo">
              <Zap className="h-2.5 w-2.5 text-white fill-white" />
            </div>
            Lummy
          </span>
          <span className="text-muted-foreground/50">— Start your store free</span>
        </Link>
      </div>
    </div>
  )
}
