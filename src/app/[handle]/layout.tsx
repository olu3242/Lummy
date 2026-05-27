import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { BRAND } from "@/config/branding"

export const metadata: Metadata = {
  title: `${BRAND.name} Store`,
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
            <Image src={BRAND.logo} alt={BRAND.name} width={16} height={16} className="h-4 w-4 rounded" />
            {BRAND.name}
          </span>
          <span className="text-muted-foreground/50">— Start your store free</span>
        </Link>
      </div>
    </div>
  )
}
