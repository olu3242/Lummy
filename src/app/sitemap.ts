import { MetadataRoute } from "next"

// In production this would query the database for all active creator handles.
// Using mock data to demonstrate the shape.
const CREATOR_HANDLES = ["sade.styles"]
const PRODUCT_IDS = ["p1", "p2", "p3", "p4"]
const BASE_URL = "https://lummy.co"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,               lastModified: new Date(), changeFrequency: "weekly",  priority: 1 },
    { url: `${BASE_URL}/pricing`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/login`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/signup`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
  ]

  const storeRoutes: MetadataRoute.Sitemap = CREATOR_HANDLES.flatMap((handle) => [
    { url: `${BASE_URL}/${handle}`,       lastModified: new Date(), changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE_URL}/${handle}/links`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    ...PRODUCT_IDS.map((id) => ({
      url: `${BASE_URL}/${handle}/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ])

  return [...staticRoutes, ...storeRoutes]
}
