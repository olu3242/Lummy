import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export interface ActivationStep {
  id: string
  label: string
  sub: string
  href: string
  done: boolean
}

export interface ActivationChecklist {
  steps: ActivationStep[]
  completedCount: number
  totalCount: number
  percentComplete: number
  isPublished: boolean
  handle: string | null
}

export async function getActivationChecklist(userId: string): Promise<ActivationChecklist | null> {
  try {
    const supabase = createClient()

    const [profileResult, userProfileResult] = await Promise.all([
      supabase
        .from("creator_profiles")
        .select("id, handle, bio, whatsapp_number, is_published, avatar_url, onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle(),
    ])

    const profile = profileResult.data
    if (!profile) return null

    const orgId = (userProfileResult.data as { organization_id: string | null } | null)?.organization_id

    const [productResult, orderResult] = await Promise.all([
      orgId
        ? supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("status", "active")
        : Promise.resolve({ count: 0 }),
      orgId
        ? supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("payment_status", "paid")
        : Promise.resolve({ count: 0 }),
    ])

    const productCount = productResult.count
    const orderCount = orderResult.count

    const p = profile as {
      handle: string | null; bio: string | null; whatsapp_number: string | null;
      is_published: boolean; avatar_url: string | null; onboarding_completed: boolean
    }

    const steps: ActivationStep[] = [
      {
        id: "profile",
        label: "Complete your profile",
        sub: "Add bio, avatar & location",
        href: "/dashboard/store",
        done: !!(p.bio && p.avatar_url),
      },
      {
        id: "product",
        label: "Add your first product",
        sub: "List something for sale",
        href: "/dashboard/products",
        done: (productCount ?? 0) > 0,
      },
      {
        id: "whatsapp",
        label: "Connect WhatsApp",
        sub: "So customers can reach you",
        href: "/dashboard/settings",
        done: !!(p.whatsapp_number),
      },
      {
        id: "publish",
        label: "Publish your storefront",
        sub: "Go live and get discovered",
        href: "/dashboard/store",
        done: p.is_published,
      },
      {
        id: "sale",
        label: "Make your first sale",
        sub: "The goal 🎯",
        href: "/dashboard/orders",
        done: (orderCount ?? 0) > 0,
      },
    ]

    const completedCount = steps.filter(s => s.done).length
    const totalCount = steps.length

    return {
      steps,
      completedCount,
      totalCount,
      percentComplete: Math.round((completedCount / totalCount) * 100),
      isPublished: p.is_published,
      handle: p.handle,
    }
  } catch (err) {
    console.error("[getActivationChecklist]", err)
    return null
  }
}

export async function publishStorefront(userId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from("creator_profiles")
    .update({
      is_published: true,
      storefront_published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function unpublishStorefront(userId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from("creator_profiles")
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getStorefrontStatus(userId: string): Promise<{ isPublished: boolean; handle: string | null } | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from("creator_profiles")
    .select("is_published, handle")
    .eq("user_id", userId)
    .maybeSingle()

  if (!data) return null
  const d = data as { is_published: boolean; handle: string | null }
  return { isPublished: d.is_published, handle: d.handle }
}

// Notify creator of activation milestones
export async function notifyFirstProduct(userId: string, productName: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "First product added! 🎉",
      body: `"${productName}" is now live on your store. Ready to publish?`,
      action_url: "/dashboard/store",
      channel: "in_app",
    })
    // Mark timestamp on profile
    await supabase.from("creator_profiles")
      .update({ first_product_added_at: new Date().toISOString() })
      .eq("user_id", userId)
  } catch { /* best-effort */ }
}

export async function notifyStorefrontPublished(userId: string, handle: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Your store is live! 🚀",
      body: `lummy.co/${handle} is now public. Share it with your audience!`,
      action_url: `/dashboard/store`,
      channel: "in_app",
    })
  } catch { /* best-effort */ }
}

export async function notifyFirstSale(userId: string, amountNgn: number): Promise<void> {
  try {
    const supabase = createAdminClient()
    const formatted = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amountNgn / 100)
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "You made your first sale! 🎊",
      body: `${formatted} just landed in your wallet. Congratulations!`,
      action_url: "/dashboard/orders",
      channel: "in_app",
    })
    await supabase.from("creator_profiles")
      .update({ first_sale_at: new Date().toISOString() })
      .eq("user_id", userId)
  } catch { /* best-effort */ }
}
