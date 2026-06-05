import { CorporatePageView, pageMetadata } from "@/lib/corporate-pages"
export const metadata = pageMetadata("legal-payments", "/legal/payments")
export default function Page() { return <CorporatePageView pageKey="legal-payments" /> }
