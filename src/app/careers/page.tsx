import type { Metadata } from "next"
import { CorporatePageView } from "@/lib/corporate-pages"
export const metadata: Metadata = { title: "Careers | Lummy", description: "Career opportunities and hiring updates from Lummy Technologies Ltd." }
export default function Page() { return <CorporatePageView pageKey="trust" /> }
