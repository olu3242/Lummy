import { CorporatePageView, pageMetadata } from "@/lib/corporate-pages"
export const metadata = pageMetadata("security", "/security")
export default function Page() { return <CorporatePageView pageKey="security" /> }
