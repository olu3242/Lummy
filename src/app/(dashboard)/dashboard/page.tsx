import { Sparkles, ArrowRight, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting"
import { ShareStorePanel } from "@/components/dashboard/share-store-panel"
import { Button } from "@/components/ui/button"
import { mockCreatorProfile } from "@/data/mock/dashboard"
import { overviewMeta, topActions } from "@/data/mock/dashboard-overview"
import { DashboardOverview } from "@/components/dashboard"
import { resolveTopActions } from "@/lib/dashboard-overview"

export default function DashboardPage() {
  const firstName = mockCreatorProfile.name.split(" ")[0]
  const resolvedTopActions = resolveTopActions(topActions, overviewMeta.handle)

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <DashboardGreeting firstName={firstName} />
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {resolvedTopActions.map((action) => {
            const Icon = action.icon === "plus" ? Plus : action.icon === "sparkles" ? Sparkles : ExternalLink
            return (
              <Link key={action.label} href={action.href} target={action.external ? "_blank" : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${action.colorClass}`}>
                <Icon className="h-3.5 w-3.5" /> {action.label}
              </Link>
            )
          })}
          <ShareStorePanel />
        </div>
      </div>

      <OnboardingChecklist />

      <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 border border-brand-purple/20"><Sparkles className="h-5 w-5 text-brand-purple" /></div>
        <div className="flex-1"><p className="text-sm font-semibold">Your AI weekly brief is ready</p><p className="text-xs text-muted-foreground mt-0.5">3 campaign ideas, 5 caption drafts, and 2 pricing recommendations based on last week&apos;s data.</p></div>
        <Button size="sm" variant="default" asChild><Link href="/dashboard/ai" className="flex items-center gap-1.5">View Brief <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
      </div>

      <DashboardOverview />
    </div>
  )
}
