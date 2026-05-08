import type { Metadata } from "next"
import { storefrontCreator } from "@/data/mock/storefront"
import { StorefrontClient } from "./storefront-client"

export async function generateMetadata({
  params,
}: {
  params: { handle: string }
}): Promise<Metadata> {
  const creator = storefrontCreator

  return {
    title: `${creator.storeName} — Shop on Lummy`,
    description: creator.bio,
    openGraph: {
      title: creator.storeName,
      description: creator.bio,
      url: `https://lummy.co/${params.handle}`,
      siteName: "Lummy",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: creator.storeName,
      description: creator.bio,
    },
    alternates: {
      canonical: `https://lummy.co/${params.handle}`,
    },
  }
}

export default function StorefrontPage({ params }: { params: { handle: string } }) {
  return <StorefrontClient handle={params.handle} />
}
