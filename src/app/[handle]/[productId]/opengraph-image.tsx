import { ImageResponse } from "next/og"
import { BRAND } from "@/config/branding"
import { formatMoney } from "@/lib/globalization"

export const runtime = "edge"
export const alt = `Product on ${BRAND.name}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const brandLogoUrl = new URL(BRAND.logo, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type StorefrontRow = { handle: string; organization_id: string | null }
type ProductRow = {
  id: string
  title: string | null
  description: string | null
  price: number | null
  currency: string | null
  image_url: string | null
  category: string | null
  sales_count: number | null
}

async function fetchStorefront(handle: string): Promise<StorefrontRow | null> {
  const url = `${supabaseUrl}/rest/v1/storefronts?handle=eq.${encodeURIComponent(handle)}&is_active=eq.true&select=handle,organization_id&limit=1`
  const res = await fetch(url, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  }).catch(() => null)
  if (!res?.ok) return null
  const rows = await res.json() as StorefrontRow[]
  return rows[0] ?? null
}

async function fetchProduct(organizationId: string, productId: string): Promise<ProductRow | null> {
  const url = `${supabaseUrl}/rest/v1/products?organization_id=eq.${encodeURIComponent(organizationId)}&id=eq.${encodeURIComponent(productId)}&status=eq.active&select=id,title,description,price,currency,image_url,category,sales_count&limit=1`
  const res = await fetch(url, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  }).catch(() => null)
  if (!res?.ok) return null
  const rows = await res.json() as ProductRow[]
  return rows[0] ?? null
}

export default async function OGImage({
  params,
}: {
  params: { handle: string; productId: string }
}) {
  const storefront = await fetchStorefront(params.handle)
  if (!storefront?.organization_id) {
    return new ImageResponse(<div style={{ background: "#080815", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 32 }}>{BRAND.name}</div>, { ...size })
  }

  const product = await fetchProduct(storefront.organization_id, params.productId)
  if (!product) {
    return new ImageResponse(<div style={{ background: "#080815", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 32 }}>{BRAND.name}</div>, { ...size })
  }

  const name = product.title ?? "Product"
  const formattedPrice = formatMoney(product.price ?? 0, product.currency ?? "USD")

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #080815 0%, #1a1035 50%, #0d0d1f 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glows */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,78,243,0.3) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, left: 100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)", display: "flex" }} />

        {/* Product image panel */}
        {product.image_url && (
          <div style={{ width: 540, height: "100%", display: "flex", position: "relative", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, #080815 100%)", display: "flex" }} />
          </div>
        )}

        {/* Content panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 52px 48px 36px", justifyContent: "space-between" }}>
          {/* Lummy logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandLogoUrl} alt={BRAND.name} width={36} height={36} style={{ width: 36, height: 36, borderRadius: 10 }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>{BRAND.name}</span>
          </div>

          {/* Product details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {product.category && (
              <div style={{ display: "flex" }}>
                <span style={{ background: "rgba(108,78,243,0.25)", border: "1px solid rgba(108,78,243,0.4)", borderRadius: 20, padding: "4px 14px", color: "#a78bfa", fontSize: 13, fontWeight: 700 }}>
                  {product.category}
                </span>
              </div>
            )}
            <span style={{ color: "white", fontSize: 36, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.2 }}>{name}</span>
            {product.description && (
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.5 }}>{product.description.slice(0, 120)}{product.description.length > 120 ? "…" : ""}</span>
            )}
            <span style={{ color: "#a78bfa", fontSize: 32, fontWeight: 900, marginTop: 4 }}>{formattedPrice}</span>
            {(product.sales_count ?? 0) > 0 && (
              <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: "white", fontSize: 20, fontWeight: 800 }}>{product.sales_count}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Sold</span>
                </div>
              </div>
            )}
          </div>

          {/* Store + CTA */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>lummy.co/{storefront.handle}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#25D366", borderRadius: 14, padding: "12px 24px" }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span style={{ color: "white", fontSize: 15, fontWeight: 700 }}>Order on WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
