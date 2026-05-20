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
      { src: "/icon.png", sizes: "800x800", type: "image/png" },
      { src: "/apple-icon.png", sizes: "800x800", type: "image/png", purpose: "maskable" },
    ],
    categories: ["shopping", "business", "productivity"],
  }
}
