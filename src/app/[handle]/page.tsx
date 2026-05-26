import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedStorefrontByHandle } from '@/repositories/storefront-repository'
import { getPublishedProductsByHandle } from '@/repositories/product-repository'
import { getCreatorByHandle } from '@/lib/queries/creator'
import { StorefrontClient } from './storefront-client'

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const storefront = await getPublishedStorefrontByHandle(params.handle)
  if (!storefront) {
    return { title: 'Store not found — Lummy' }
  }

  const storeName = (storefront.organizations as { name?: string } | null)?.name ?? `${params.handle} Store`
  const description = storefront.bio || `${storeName} on Lummy`

  return {
    title: `${storeName} — Shop on Lummy`,
    description,
    openGraph: { title: storeName, description, url: `https://lummy.co/${params.handle}`, siteName: 'Lummy', type: 'website' },
    twitter: { card: 'summary_large_image', title: storeName, description },
    alternates: { canonical: `https://lummy.co/${params.handle}` },
  }
}

export default async function StorefrontPage({ params }: { params: { handle: string } }) {
  const [storefront, products, creatorProfile] = await Promise.all([
    getPublishedStorefrontByHandle(params.handle),
    getPublishedProductsByHandle(params.handle).catch(() => []),
    getCreatorByHandle(params.handle),
  ])
  if (!storefront) notFound()

  const storeName = (storefront.organizations as { name?: string } | null)?.name ?? `${params.handle} Store`
  return (
    <StorefrontClient
      handle={params.handle}
      storeName={storeName}
      bio={storefront.bio ?? ''}
      products={products ?? []}
      storeSchema={creatorProfile?.store_schema ?? null}
      whatsappNumber={creatorProfile?.whatsapp_number ?? null}
    />
  )
}
