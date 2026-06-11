import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/server"
import { logApiEvent } from "@/lib/ops-observability"

type TopProduct = {
  id: string
  title: string
  image_url: string | null
  revenue: number
  sales: number
}

async function getTopProducts(correlationId?: string): Promise<TopProduct[]> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []

  const membership = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (membership.error) {
    logApiEvent("error", "dashboard.top_products_query_failed", {
      correlationId,
      query: "TopProducts.membership",
      code: membership.error.code,
      message: membership.error.message,
      details: membership.error.details,
      hint: membership.error.hint,
    })
    return []
  }
  if (!membership.data?.organization_id) return []

  const products = await supabase
    .from("products")
    .select("id,title,image_url,status")
    .eq("organization_id", membership.data.organization_id)
    .eq("status", "active")
    .limit(20)
  if (products.error) {
    logApiEvent("error", "dashboard.top_products_query_failed", {
      correlationId,
      query: "TopProducts.products",
      code: products.error.code,
      message: products.error.message,
      details: products.error.details,
      hint: products.error.hint,
    })
    return []
  }

  return (products.data ?? [])
    .map((product) => {
      const revenue = 0
      const sales = 0
      return { id: product.id, title: product.title, image_url: product.image_url, revenue, sales }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

export async function TopProducts({ correlationId }: { correlationId?: string }) {
  const sorted = await getTopProducts(correlationId).catch((error) => {
    const err = error as { code?: string; message?: string; details?: string; hint?: string }
    logApiEvent("error", "dashboard.top_products_failed", {
      correlationId,
      query: "getTopProducts",
      code: err?.code,
      message: err?.message ?? String(error),
      details: err?.details,
      hint: err?.hint,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return []
  })

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
        {sorted.length === 0 && (
          <li className="text-xs text-muted-foreground">No active product revenue yet.</li>
        )}
        {sorted.map((product, i) => (
          <li key={product.id} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground/60 w-4 flex-shrink-0">{i + 1}</span>
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-border">
              {product.image_url ? <Image src={product.image_url} alt={product.title} fill className="object-cover" unoptimized /> : <div className="h-full w-full bg-muted" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold truncate pr-2">{product.title}</p>
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
