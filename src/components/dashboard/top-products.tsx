import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { mockProducts } from "@/data/mock/dashboard"

export function TopProducts() {
  const sorted = [...mockProducts]
    .filter((p) => p.status === "active")
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const maxRevenue = sorted[0]?.revenue ?? 1

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-bold">Top Products</h3>
          <p className="text-xs text-muted-foreground">By revenue · active only</p>
        </div>
        <Link href="/dashboard/products" className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
          All products
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <ul className="space-y-4">
        {sorted.map((product, i) => (
          <li key={product.id} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground/60 w-4 flex-shrink-0">{i + 1}</span>
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-border">
              <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold truncate pr-2">{product.name}</p>
                <p className="text-xs font-bold text-brand-green flex-shrink-0">
                  ₦{(product.revenue / 1000).toFixed(0)}k
                </p>
              </div>
              <Progress
                value={(product.revenue / maxRevenue) * 100}
                className="h-1.5"
                indicatorClassName="bg-gradient-to-r from-brand-purple to-brand-indigo"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{product.sales} sales</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
