import { CorporatePageView, pageMetadata } from "@/lib/corporate-pages"
export const metadata = pageMetadata("privacy", "/privacy")
export default function Page() { return <CorporatePageView pageKey="privacy" /> }
