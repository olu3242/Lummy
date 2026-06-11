import { MetadataRoute } from "next"
import { BRAND } from "@/config/branding"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#080815",
    theme_color: "#6C4EF3",
    orientation: "portrait",
    icons: [
      { src: BRAND.icon, sizes: "800x800", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    categories: ["shopping", "business", "productivity"],
    screenshots: [
      { src: "/screenshot-mobile.png",  sizes: "390x844",  type: "image/png" },
      { src: "/screenshot-desktop.png", sizes: "1280x800", type: "image/png" },
    ],
  }
}
