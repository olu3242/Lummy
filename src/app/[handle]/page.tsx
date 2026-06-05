import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedStorefrontByHandle } from '@/repositories/storefront-repository'
import { getPublishedProductsByHandle } from '@/repositories/product-repository'
import { BRAND } from '@/config/branding'
import { StorefrontClient } from './storefront-client'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SCHEMA } from '@/store/schema/defaults'
import type { StoreSchema } from '@/store/schema/types'

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const storefront = await getPublishedStorefrontByHandle(params.handle)
  if (!storefront) {
    return { title: `Store not found — ${BRAND.name}` }
  }

  const storeName = (storefront.organizations as { name?: string } | null)?.name ?? `${params.handle} Store`
  const description = storefront.bio || `${storeName} on ${BRAND.name}`

  return {
    title: `${storeName} — Shop on ${BRAND.name}`,
    description,
    openGraph: { title: storeName, description, url: `https://lummy.co/${params.handle}`, siteName: BRAND.name, type: 'website' },
    twitter: { card: 'summary_large_image', title: storeName, description },
    alternates: { canonical: `https://lummy.co/${params.handle}` },
  }
}

export default async function StorefrontPage({ params }: { params: { handle: string } }) {
  const [storefront, products] = await Promise.all([
    getPublishedStorefrontByHandle(params.handle).catch(() => null),
    getPublishedProductsByHandle(params.handle).catch(() => []),
  ])
  if (!storefront) notFound()

  const organization = storefront.organizations as { name?: string; owner_id?: string } | null
  const storeName = organization?.name ?? `${params.handle} Store`
  const storefrontData = storefront as unknown as {
    store_schema?: import('@/lib/supabase/types').Json
    theme?: { accent?: string; font?: StoreSchema['theme']['font']; layout?: StoreSchema['theme']['layout']; showReviews?: boolean; showStock?: boolean } | null
  }
  const fallbackSchema = storefrontData.theme
    ? {
        ...DEFAULT_SCHEMA,
        theme: {
          ...DEFAULT_SCHEMA.theme,
          accent: storefrontData.theme.accent ?? DEFAULT_SCHEMA.theme.accent,
          font: storefrontData.theme.font ?? DEFAULT_SCHEMA.theme.font,
          layout: storefrontData.theme.layout ?? DEFAULT_SCHEMA.theme.layout,
        },
        showReviews: storefrontData.theme.showReviews ?? DEFAULT_SCHEMA.showReviews,
        showStock: storefrontData.theme.showStock ?? DEFAULT_SCHEMA.showStock,
        sections: DEFAULT_SCHEMA.sections,
      }
    : null
  const supabase = createClient()
  const profileResult = organization?.owner_id
    ? await supabase
        .from('profiles')
        .select('full_name,avatar_url,phone')
        .eq('id', organization.owner_id)
        .maybeSingle()
    : null
  const profile = profileResult && !profileResult.error
    ? profileResult.data as { full_name?: string | null; avatar_url?: string | null; phone?: string | null } | null
    : null
  return (
    <StorefrontClient
      handle={params.handle}
      storeName={storeName}
      bio={storefront.bio ?? ''}
      products={products ?? []}
      storeSchema={storefrontData.store_schema ?? (fallbackSchema as unknown as import('@/lib/supabase/types').Json | null)}
      whatsappNumber={profile?.phone ?? null}
      creatorName={profile?.full_name ?? storeName}
      avatarUrl={profile?.avatar_url ?? null}
      coverUrl={storefront.hero_image ?? null}
      socialLinks={(storefront.social_links as Record<string, string> | null) ?? null}
    />
  )
}
