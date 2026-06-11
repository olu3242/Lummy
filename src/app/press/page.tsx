import type { Metadata } from "next"
import { CorporatePageView } from "@/lib/corporate-pages"
export const metadata: Metadata = { title: "Press & Media | Lummy", description: "Press, media, and company information for Lummy Technologies Ltd." }
export default function Page() { return <CorporatePageView pageKey="trust" /> }
