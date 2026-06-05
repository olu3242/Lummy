import type { Metadata } from "next"
import { CorporatePageView } from "@/lib/corporate-pages"
export const metadata: Metadata = { title: "Brand Assets | Lummy", description: "Brand and media asset guidance for Lummy." }
export default function Page() { return <CorporatePageView pageKey="trust" /> }
