import { notFound } from "next/navigation"
import { getPublishedStorefrontByHandle } from "@/repositories/storefront-repository"
import { getPublishedProductsByHandle } from "@/repositories/product-repository"
import { createClient } from "@/lib/supabase/server"
import { LinksClient } from "../links-client"

export default async function LinkInBioPage({ params }: { params: { handle: string } }) {
  const [storefront, products] = await Promise.all([
    getPublishedStorefrontByHandle(params.handle).catch(() => null),
    getPublishedProductsByHandle(params.handle).catch(() => []),
  ])

  if (!storefront) notFound()

  const organization = storefront.organizations as { name?: string; owner_id?: string } | null
  const storeName = organization?.name ?? `${params.handle} Store`

  const supabase = createClient()
  const profileResult = organization?.owner_id
    ? await supabase
        .from("profiles")
        .select("full_name,avatar_url,phone")
        .eq("id", organization.owner_id)
        .maybeSingle()
    : null
  const profile = profileResult && !profileResult.error ? profileResult.data as { full_name?: string | null; avatar_url?: string | null; phone?: string | null } | null : null

  const socialLinks = (storefront.social_links as Record<string, string> | null) ?? {}
  const publishedProducts = (products ?? []) as Array<{
    id: string
    title?: string | null
    name?: string | null
    price?: number | string | null
    currency?: string | null
    image_url?: string | null
  }>

  const creator = {
    storeName,
    handle: storefront.handle,
    bio: storefront.bio ?? "",
    avatar: profile?.avatar_url ?? storefront.hero_image ?? "",
    whatsapp: profile?.phone ?? "",
    verified: false,
    socialLinks: {
      instagram: socialLinks.instagram ?? "",
      twitter: socialLinks.twitter ?? "",
    },
    productCount: publishedProducts.length,
    products: publishedProducts.slice(0, 4).map(p => ({
      id: p.id,
      name: p.title ?? (p as { name?: string | null }).name ?? "Product",
      price: Number(p.price ?? 0),
      currency: p.currency ?? "USD",
      image: p.image_url ?? "/placeholder-product.jpg",
    })),
  }

  return <LinksClient creator={creator} handle={params.handle} />
}
