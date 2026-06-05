import type { Metadata } from "next"
import { BRAND } from "@/config/branding"
import { createAdminClient } from "@/lib/supabase/server"
import { ProductDetailClient } from "./product-detail-client"

type PublicProduct = {
  id: string
  title: string
  description: string | null
  price: number | string
  currency: string | null
  image_url: string | null
}

async function getPublicProduct(handle: string, productId: string) {
  const supabase = createAdminClient()
  const { data: storefront, error: storefrontError } = await supabase
    .from("storefronts")
    .select("organization_id,is_active,organizations(name)")
    .eq("handle", handle)
    .maybeSingle()

  if (storefrontError || !storefront?.is_active) return null

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,title,description,price,currency,image_url,status")
    .eq("id", productId)
    .eq("organization_id", storefront.organization_id)
    .eq("status", "active")
    .maybeSingle()

  if (productError || !product) return null

  const org = Array.isArray(storefront.organizations) ? storefront.organizations[0] : storefront.organizations
  return {
    product: product as PublicProduct,
    storeName: (org as { name?: string | null } | null)?.name ?? `${handle} Store`,
  }
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string; productId: string }
}): Promise<Metadata> {
  const result = await getPublicProduct(params.handle, params.productId)

  if (!result) return { title: `Product not found — ${BRAND.name}` }

  const { product, storeName } = result
  const description = product.description ?? `${product.title} from ${storeName} on ${BRAND.name}`
  const canonical = `https://lummy.co/${params.handle}/${params.productId}`

  return {
    title: `${product.title} — ${storeName} on ${BRAND.name}`,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.image_url ? [{ url: product.image_url, width: 800, height: 800, alt: product.title }] : undefined,
      url: canonical,
      siteName: BRAND.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
    alternates: {
      canonical,
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { handle: string; productId: string }
}) {
  const result = await getPublicProduct(params.handle, params.productId)
  const productSchema = result
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: result.product.title,
        description: result.product.description ?? undefined,
        image: result.product.image_url ?? undefined,
        url: `https://lummy.co/${params.handle}/${params.productId}`,
        brand: { "@type": "Brand", name: result.storeName },
        offers: {
          "@type": "Offer",
          price: String(result.product.price),
          priceCurrency: result.product.currency ?? "NGN",
          availability: "https://schema.org/InStock",
          url: `https://lummy.co/${params.handle}/${params.productId}/checkout`,
        },
      }
    : null

  return (
    <>
      {productSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      ) : null}
      <ProductDetailClient handle={params.handle} productId={params.productId} />
    </>
  )
}
