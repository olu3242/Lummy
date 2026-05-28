import { redirect } from 'next/navigation'
import { Sparkles, ArrowRight, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting'
import { ShareStorePanel } from '@/components/dashboard/share-store-panel'
import { Button } from '@/components/ui/button'
import { topActions } from '@/data/mock/dashboard-overview'
import { DashboardOverview } from '@/components/dashboard'
import { resolveTopActions } from '@/lib/dashboard-overview'
import { createClient } from '@/lib/supabase/server'
import { logApiEvent } from '@/lib/ops-observability'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const correlationId = crypto.randomUUID()
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data: profileRaw, error: profileError } = await supabase
    .from('profiles')
    .select('full_name,onboarding_completed,organization_id')
    .eq('id', auth.user.id)
    .maybeSingle()
  const profile = profileRaw as { full_name: string | null; onboarding_completed: boolean; organization_id: string | null } | null

  if (profileError) {
    // Log but do NOT redirect — a transient DB/RLS error should not loop the user to onboarding.
    logApiEvent('error', 'dashboard.profile_query_failed', { correlationId, message: profileError.message, userId: auth.user.id })
    // Fall through and render the dashboard with empty state rather than creating a redirect loop.
  }

  // Only redirect when we have positive confirmation the user hasn't finished onboarding.
  // Never redirect on null/undefined profile — that could be a transient query failure.
  if (profile && profile.onboarding_completed === false) {
    redirect('/onboarding')
  }
  if (profile && !profile.organization_id) {
    redirect('/onboarding?reason=no-org')
  }
  // No profile row at all — new signup without a trigger; send to onboarding to set up
  if (!profile && !profileError) {
    redirect('/onboarding')
  }

  const membership = profile?.organization_id ? await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', profile.organization_id)
    .eq('user_id', auth.user.id)
    .maybeSingle() : null

  if (membership?.error) {
    // Membership query failed — log and continue rather than redirecting to onboarding
    logApiEvent('error', 'dashboard.membership_query_failed', { correlationId, message: membership.error.message, userId: auth.user.id })
  }

  // Self-heal: profile.organization_id is set but membership row is missing.
  if (profile?.organization_id && membership && !membership.error && !membership.data) {
    const orgExists = await supabase
      .from('organizations')
      .select('id')
      .eq('id', profile.organization_id)
      .maybeSingle()

    if (orgExists.data?.id) {
      await supabase
        .from('organization_members')
        .upsert({ organization_id: profile.organization_id, user_id: auth.user.id, role: 'owner' }, { onConflict: 'organization_id,user_id' })
      logApiEvent('warn', 'dashboard.membership_self_healed', { correlationId, orgId: profile.organization_id, userId: auth.user.id })
    } else {
      // Org is gone — clear stale FK and redirect to onboarding (only case where we redirect on org issue)
      await supabase.from('profiles').update({ organization_id: null, onboarding_completed: false }).eq('id', auth.user.id)
      redirect('/onboarding')
    }
  }

  const firstName = (profile?.full_name || auth.user.email || 'Creator').split(' ')[0]
  const storefront = profile?.organization_id ? await supabase
    .from('storefronts')
    .select('handle')
    .eq('organization_id', profile.organization_id)
    .maybeSingle() : null
  if (storefront?.error) {
    logApiEvent('warn', 'dashboard.storefront_query_failed', { correlationId, message: storefront.error.message, orgId: profile?.organization_id })
  }
  const resolvedTopActions = resolveTopActions(topActions, storefront?.data?.handle ?? 'dashboard')

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <DashboardGreeting firstName={firstName} />
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {resolvedTopActions.map((action) => {
            const Icon = action.icon === 'plus' ? Plus : action.icon === 'sparkles' ? Sparkles : ExternalLink
            return (
              <Link key={action.label} href={action.href} target={action.external ? '_blank' : undefined}
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
