import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lummy — Creator Commerce OS",
    short_name: "Lummy",
    description: "Your WhatsApp storefront. Sell anything, anywhere in Africa.",
    start_url: "/",
    display: "standalone",
    background_color: "#080815",
    theme_color: "#6C4EF3",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png",  sizes: "192x192",  type: "image/png" },
      { src: "/icon-512.png",  sizes: "512x512",  type: "image/png" },
      { src: "/icon-mask.png", sizes: "512x512",  type: "image/png", purpose: "maskable" },
    ],
    categories: ["shopping", "business", "productivity"],
    screenshots: [
      { src: "/screenshot-mobile.png",  sizes: "390x844",  type: "image/png" },
      { src: "/screenshot-desktop.png", sizes: "1280x800", type: "image/png" },
    ],
  }
}
