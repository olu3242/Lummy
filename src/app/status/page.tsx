import { CorporatePageView, pageMetadata } from "@/lib/corporate-pages"
export const metadata = pageMetadata("status", "/status")
export default function Page() { return <CorporatePageView pageKey="status" /> }
