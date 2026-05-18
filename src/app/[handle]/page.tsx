import type { Metadata } from "next"
import { storefrontCreator } from "@/data/mock/storefront"
import { getCreatorByHandle } from "@/lib/queries/creator"
import { StorefrontClient } from "./storefront-client"

export async function generateMetadata({
  params,
}: {
  params: { handle: string }
}): Promise<Metadata> {
  // Try real DB first; fall back to mock for dev
  const creator = await getCreatorByHandle(params.handle).catch(() => null)
  const name = creator?.business_name ?? storefrontCreator.storeName
  const bio = creator?.bio ?? storefrontCreator.bio
  const url = `https://lummy.co/${params.handle}`

  return {
    title: `${name} — Shop on Lummy`,
    description: bio ?? undefined,
    openGraph: {
      title: name,
      description: bio ?? undefined,
      url,
      siteName: "Lummy",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: bio ?? undefined,
    },
    alternates: { canonical: url },
  }
}

export default async function StorefrontPage({ params }: { params: { handle: string } }) {
  // Attempt to load real creator data server-side
  const dbCreator = await getCreatorByHandle(params.handle).catch(() => null)

  if (!dbCreator) {
    // Handle not found in DB — render with mock data (dev mode / preview)
    return <StorefrontClient handle={params.handle} />
  }

  return <StorefrontClient handle={params.handle} dbCreatorId={dbCreator.id} dbStoreSchema={dbCreator.store_schema} />
}
