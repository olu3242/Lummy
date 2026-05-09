import { ImageResponse } from "next/og"
import { storefrontCreator } from "@/data/mock/storefront"

export const runtime = "edge"
export const alt = "Lummy creator storefront"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage() {
  const creator = storefrontCreator

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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6C4EF3, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "white", fontSize: 22, fontWeight: 900 }}>⚡</div>
          </div>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>Lummy</span>
        </div>

        {/* Store name */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(108,78,243,0.2)", border: "2px solid rgba(108,78,243,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 36 }}>🛍️</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "white", fontSize: 42, fontWeight: 900, letterSpacing: -1 }}>{creator.storeName}</span>
                {creator.verified && <span style={{ background: "rgba(108,78,243,0.3)", border: "1px solid rgba(108,78,243,0.5)", borderRadius: 20, padding: "4px 12px", color: "#a78bfa", fontSize: 14, fontWeight: 700 }}>✓ Verified</span>}
              </div>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }}>lummy.co/{creator.handle}</span>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 22, lineHeight: 1.5, maxWidth: 700, margin: 0 }}>{creator.bio}</p>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
          {[
            { label: "Products",   value: String(creator.publicProducts.length) },
            { label: "Customers",  value: creator.stats.totalOrders.toLocaleString() },
            { label: "Rating",     value: `${creator.stats.avgRating}★` },
          ].map(stat => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "white", fontSize: 28, fontWeight: 800 }}>{stat.value}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{stat.label}</span>
            </div>
          ))}
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
