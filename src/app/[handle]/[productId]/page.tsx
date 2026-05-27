import type { Metadata } from "next"
import { BRAND } from "@/config/branding"
import { storefrontCreator } from "@/data/mock/storefront"
import { ProductDetailClient } from "./product-detail-client"

export async function generateMetadata({
  params,
}: {
  params: { handle: string; productId: string }
}): Promise<Metadata> {
  const creator = storefrontCreator
  const product = creator.publicProducts.find(p => p.id === params.productId)
  const p = product ?? creator.publicProducts[0]

  if (!p) return { title: `Product — ${BRAND.name}` }

  return {
    title: `${p.name} — ${creator.storeName} on ${BRAND.name}`,
    description: p.description,
    openGraph: {
      title: p.name,
      description: p.description,
      images: [{ url: p.image, width: 800, height: 800, alt: p.name }],
      url: `https://lummy.co/${params.handle}/${params.productId}`,
      siteName: BRAND.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description: p.description,
      images: [p.image],
    },
    alternates: {
      canonical: `https://lummy.co/${params.handle}/${params.productId}`,
    },
  }
}

export default function ProductDetailPage({
  params,
}: {
  params: { handle: string; productId: string }
}) {
  return <ProductDetailClient handle={params.handle} productId={params.productId} />
}
