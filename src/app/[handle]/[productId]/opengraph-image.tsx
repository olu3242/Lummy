import { ImageResponse } from "next/og"
import { BRAND } from "@/config/branding"
import { storefrontCreator } from "@/data/mock/storefront"

export const runtime = "edge"
export const alt = `Product on ${BRAND.name}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({
  params,
}: {
  params: { handle: string; productId: string }
}) {
  const creator = storefrontCreator
  const product = creator.publicProducts.find(p => p.id === params.productId)
  const p = product ?? creator.publicProducts[0]

  if (!p) return new ImageResponse(<div>Not found</div>, { ...size })

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
        <div style={{ width: 540, height: "100%", display: "flex", position: "relative", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, #080815 100%)", display: "flex" }} />
        </div>

        {/* Content panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 52px 48px 36px", justifyContent: "space-between" }}>
          {/* Lummy logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.logo} alt={BRAND.name} width={36} height={36} style={{ width: 36, height: 36, borderRadius: 10 }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>{BRAND.name}</span>
          </div>

          {/* Product details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex" }}>
              <span style={{ background: "rgba(108,78,243,0.25)", border: "1px solid rgba(108,78,243,0.4)", borderRadius: 20, padding: "4px 14px", color: "#a78bfa", fontSize: 13, fontWeight: 700 }}>
                {p.category}
              </span>
            </div>
            <span style={{ color: "white", fontSize: 36, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.2 }}>{p.name}</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, overflow: "hidden" }}>{p.description}</span>

            {/* Price */}
            <span style={{ color: "#a78bfa", fontSize: 32, fontWeight: 900, marginTop: 4 }}>₦{p.price.toLocaleString()}</span>

            {/* Stats */}
            <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: "white", fontSize: 20, fontWeight: 800 }}>{p.sales}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Sold</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: "white", fontSize: 20, fontWeight: 800 }}>4.9★</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Rating</span>
              </div>
            </div>
          </div>

          {/* Store + CTA */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>lummy.co/{creator.handle}</span>
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
