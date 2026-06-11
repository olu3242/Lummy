import { CorporatePageView, pageMetadata } from "@/lib/corporate-pages"
export const metadata = pageMetadata("terms", "/terms")
export default function Page() { return <CorporatePageView pageKey="terms" /> }
