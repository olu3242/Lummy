import type { Metadata } from "next"
import { CorporatePageView } from "@/lib/corporate-pages"
export const metadata: Metadata = { title: "Affiliate Program | Lummy", description: "Affiliate program information for Lummy." }
export default function Page() { return <CorporatePageView pageKey="trust" /> }
