import type { Metadata } from "next"
import { CorporatePageView } from "@/lib/corporate-pages"
export const metadata: Metadata = { title: "Accessibility | Lummy", description: "Accessibility commitments and support contact information for Lummy." }
export default function Page() { return <CorporatePageView pageKey="trust" /> }
