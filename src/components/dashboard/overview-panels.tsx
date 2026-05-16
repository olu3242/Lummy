import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { focusItems, healthSignals, kpiTargets, milestoneCards, overviewCopy, overviewEmptyStates, overviewMeta, quickActions } from "@/data/mock/dashboard-overview"
import { formatMetric, targetProgress, toneClassByType } from "@/lib/dashboard-overview"

export function FocusQueuePanel() {
  const RefreshIcon = overviewMeta.focusRefreshIcon
  return (
    <section aria-labelledby="focus-queue-heading" className="xl:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="focus-queue-heading" className="text-sm font-bold">Today&apos;s Focus Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{overviewCopy.focusSubheading}</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground inline-flex items-center gap-1"><RefreshIcon className="h-3 w-3" /> {overviewMeta.focusRefreshLabel}</span>
      </div>
      {focusItems.length === 0 ? (
        <p className="text-xs text-muted-foreground">{overviewEmptyStates.focus}</p>
      ) : (
        <ul className="space-y-2.5" role="list">
          {focusItems.map((item) => {
            const Icon = item.icon
            const tone = toneClassByType[item.tone]
            return (
              <li key={item.id}>
                <Link href={item.cta} className="flex items-start gap-3 rounded-xl border border-border bg-background/50 px-3.5 py-3 hover:bg-accent/50 transition-colors">
                  <span className={cn("mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center", tone)}><Icon className="h-3.5 w-3.5" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-1" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function TargetTrackerPanel() {
  const TrackerIcon = overviewMeta.trackerIcon
  return (
    <section aria-labelledby="target-tracker-heading" className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="target-tracker-heading" className="text-sm font-bold">{overviewCopy.trackerHeading}</h2>
        <TrackerIcon className="h-4 w-4 text-brand-purple" />
      </div>
      <div className="space-y-4">
        {kpiTargets.length === 0 ? (
          <p className="text-xs text-muted-foreground">{overviewEmptyStates.kpi}</p>
        ) : (
          kpiTargets.map((item) => {
            const pct = targetProgress(item.current, item.target)
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]"><span className="font-medium">{item.label}</span><span className="text-muted-foreground">{pct}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-brand-purple" style={{ width: `${pct}%` }} /></div>
                <p className="text-[10px] text-muted-foreground">{formatMetric(item.current, item.prefix, item.suffix)} / {formatMetric(item.target, item.prefix, item.suffix)}</p>
              </div>
            )
          })
        )}
      </div>
      <Link href="/dashboard/goals" className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:underline">{overviewCopy.trackerCta} <ArrowRight className="h-3 w-3" /></Link>
    </section>
  )
}

export function HealthSignalsStrip() {
  return (
    <section aria-label="Store health signals" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {healthSignals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{overviewEmptyStates.health}</p>
        </div>
      ) : (
        healthSignals.map((signal) => {
          const Icon = signal.icon
          const tone = toneClassByType[signal.tone]
          return (
            <div key={signal.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">{signal.label}</p>
                  <p className="text-lg font-bold mt-1">{signal.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{signal.note}</p>
                </div>
                <span className={cn("h-8 w-8 rounded-lg flex items-center justify-center", tone)}><Icon className="h-4 w-4" /></span>
              </div>
            </div>
          )
        })
      )}
    </section>
  )
}

export function QuickActionsPanel() {
  return (
    <section aria-labelledby="quick-actions-heading" className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 id="quick-actions-heading" className="text-sm font-bold">{overviewCopy.quickActionsHeading}</h2>
      {quickActions.length === 0 ? (
        <p className="text-xs text-muted-foreground">{overviewEmptyStates.quickActions}</p>
      ) : (
        <ul className="space-y-2" role="list">
          {quickActions.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className={cn("flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80", item.color)}>
                {item.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function MilestonesPanel() {
  return (
    <section aria-labelledby="milestones-heading" className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 id="milestones-heading" className="text-sm font-bold">This Week&apos;s Milestones</h2>
        <Link href="/dashboard/reports" className="text-xs text-brand-purple font-semibold inline-flex items-center gap-1 hover:underline">{overviewCopy.milestonesCta} <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      {milestoneCards.length === 0 ? (
        <p className="text-xs text-muted-foreground">{overviewEmptyStates.milestones}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" role="list">
          {milestoneCards.map((card) => {
            const Icon = card.icon
            return (
              <li key={card.label} className="rounded-xl border border-border p-3 bg-background/50">
                <p className="text-muted-foreground mb-1 inline-flex items-center gap-1"><Icon className={cn("h-3.5 w-3.5", card.iconClass)} /> {card.label}</p>
                <p className="text-base font-bold">{card.value}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
