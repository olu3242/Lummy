import { ImageResponse } from "next/og"
import { BRAND } from "@/config/branding"

export const runtime = "edge"
export const alt = `${BRAND.name} creator storefront`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const brandLogoUrl = new URL(BRAND.logo, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type StorefrontRow = {
  handle: string
  bio: string | null
  organization_id: string | null
  organizations: { name: string | null } | null
}

type ProductCountRow = { id: string }

async function fetchStorefront(handle: string): Promise<StorefrontRow | null> {
  const url = `${supabaseUrl}/rest/v1/storefronts?handle=eq.${encodeURIComponent(handle)}&is_active=eq.true&select=handle,bio,organization_id,organizations(name)&limit=1`
  const res = await fetch(url, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  }).catch(() => null)
  if (!res?.ok) return null
  const rows = await res.json() as StorefrontRow[]
  return rows[0] ?? null
}

async function fetchProductCount(organizationId: string): Promise<number> {
  const url = `${supabaseUrl}/rest/v1/products?organization_id=eq.${encodeURIComponent(organizationId)}&status=eq.active&select=id`
  const res = await fetch(url, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  }).catch(() => null)
  if (!res?.ok) return 0
  const rows = await res.json() as ProductCountRow[]
  return rows.length
}

export default async function OGImage({ params }: { params: { handle: string } }) {
  const storefront = await fetchStorefront(params.handle)
  const storeName = storefront?.organizations?.name ?? params.handle
  const bio = storefront?.bio ?? `Shop on ${BRAND.name}`
  const handle = storefront?.handle ?? params.handle
  const productCount = storefront?.organization_id
    ? await fetchProductCount(storefront.organization_id)
    : 0

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #080815 0%, #1a1035 50%, #0d0d1f 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,78,243,0.3) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, left: 200, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)", display: "flex" }} />

        {/* Lummy logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogoUrl} alt={BRAND.name} width={44} height={44} style={{ width: 44, height: 44, borderRadius: 12 }} />
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>{BRAND.name}</span>
        </div>

        {/* Store name */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(108,78,243,0.2)", border: "2px solid rgba(108,78,243,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 36 }}>🛍️</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ color: "white", fontSize: 42, fontWeight: 900, letterSpacing: -1 }}>{storeName}</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }}>lummy.co/{handle}</span>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 22, lineHeight: 1.5, maxWidth: 700, margin: 0 }}>{bio}</p>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
          {productCount > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "white", fontSize: 28, fontWeight: 800 }}>{productCount}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Products</span>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, background: "#25D366", borderRadius: 16, padding: "14px 28px" }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <span style={{ color: "white", fontSize: 18, fontWeight: 700 }}>Order on WhatsApp</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
