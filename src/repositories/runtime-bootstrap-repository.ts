import type { User } from "@supabase/supabase-js";

type SupabaseLike = {
  from: (table: string) => any;
};

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "dashboard",
  "login",
  "signup",
  "onboarding",
  "www",
  "support",
  "help",
  "root",
]);

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9- ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function profileName(user: User) {
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Creator"
  );
}

async function uniqueOrgSlug(supabase: SupabaseLike, userId: string, name: string) {
  const base = toSlug(name) || `creator-${userId.slice(0, 8)}`;
  const safeBase = RESERVED_SLUGS.has(base) ? `${base}-${userId.slice(0, 4)}` : base;

  for (let i = 0; i < 5; i += 1) {
    const candidate = `${safeBase}${i === 0 ? "" : `-${i + 1}`}`;
    const clash = await supabase.from("organizations").select("id").eq("slug", candidate).limit(1);
    if (clash.error) throw clash.error;
    if ((clash.data?.length ?? 0) === 0) return candidate;
  }

  return `${safeBase}-${userId.slice(0, 6)}`;
}

export async function ensureCreatorRuntimeContext(supabase: SupabaseLike, user: User) {
  const email = user.email ?? `${user.id}@unknown.lummy.local`;
  const fullName = profileName(user);

  const profile = await supabase
    .from("profiles")
    .select("id,email,full_name,avatar_url,organization_id,onboarding_completed,onboarding_step")
    .eq("id", user.id)
    .maybeSingle();
  if (profile.error) throw profile.error;

  const profileUpsert = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      full_name: profile.data?.full_name ?? fullName,
      avatar_url: profile.data?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      onboarding_completed: profile.data?.onboarding_completed ?? false,
      onboarding_step: profile.data?.onboarding_step ?? "profile",
    },
    { onConflict: "id" },
  );
  if (profileUpsert.error) throw profileUpsert.error;

  let organizationId = profile.data?.organization_id ?? null;

  if (organizationId) {
    const membership = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership.error) throw membership.error;
    if (!membership.data?.id) {
      const createdMembership = await supabase.from("organization_members").insert({
        organization_id: organizationId,
        user_id: user.id,
        role: "owner",
      });
      if (createdMembership.error) throw createdMembership.error;
    }
  } else {
    const existingMembership = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existingMembership.error) throw existingMembership.error;

    organizationId = existingMembership.data?.organization_id ?? null;

    if (!organizationId) {
      const ownedOrg = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (ownedOrg.error) throw ownedOrg.error;

      if (ownedOrg.data?.id) {
        organizationId = ownedOrg.data.id;
      } else {
        const organizationName =
          user.user_metadata?.store_name ??
          user.user_metadata?.business_name ??
          `${fullName}'s Store`;
        const createdOrg = await supabase
          .from("organizations")
          .insert({
            owner_id: user.id,
            name: organizationName,
            slug: await uniqueOrgSlug(supabase, user.id, organizationName),
            country: "US",
            currency: "USD",
          })
          .select("id")
          .single();
        if (createdOrg.error) throw createdOrg.error;

        organizationId = createdOrg.data.id;
      }

      const createdMembership = await supabase.from("organization_members").insert({
        organization_id: organizationId,
        user_id: user.id,
        role: "owner",
      });
      if (createdMembership.error) throw createdMembership.error;
    }
  }

  const profileOrgUpdate = await supabase
    .from("profiles")
    .update({ organization_id: organizationId, onboarding_step: profile.data?.onboarding_step ?? "profile" })
    .eq("id", user.id);
  if (profileOrgUpdate.error) throw profileOrgUpdate.error;

  const onboardingState = await supabase.from("onboarding_states").upsert(
    {
      user_id: user.id,
      organization_id: organizationId,
      current_step: profile.data?.onboarding_completed ? "completed" : "profile",
      completed: profile.data?.onboarding_completed ?? false,
    },
    { onConflict: "user_id" },
  );
  if (onboardingState.error) throw onboardingState.error;

  return {
    organizationId,
    onboardingCompleted: profile.data?.onboarding_completed ?? false,
  };
}
