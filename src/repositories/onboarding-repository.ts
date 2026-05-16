import { createClient } from '@/lib/supabase/server';

export async function saveOnboardingProfile(input: { full_name?: string; phone?: string; country?: string; currency?: string }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  await supabase.from('profiles').upsert({ id: auth.user.id, email: auth.user.email!, full_name: input.full_name ?? null, phone: input.phone ?? null });
  await supabase.from('organizations').upsert({ owner_id: auth.user.id, name: `${input.full_name ?? 'Creator'} Org`, slug: auth.user.id.slice(0, 8), country: input.country ?? 'US', currency: input.currency ?? 'USD' }, { onConflict: 'owner_id' });
}

const RESERVED_ORG_SLUGS = new Set(['admin', 'api', 'app', 'dashboard', 'login', 'signup', 'onboarding', 'www']);

const toSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9- ]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

export async function ensureOrganizationForUser(input: { userId: string; orgName: string; country?: string; currency?: string }) {
  const supabase = await createClient();
  const existing = await supabase.from('organizations').select('*').eq('owner_id', input.userId).limit(1).maybeSingle();
  if (existing.data) return existing.data;

  const base = toSlug(input.orgName) || `org-${input.userId.slice(0, 6)}`;
  let slug = RESERVED_ORG_SLUGS.has(base) ? `${base}-${input.userId.slice(0, 4)}` : base;

  const clash = await supabase.from('organizations').select('id').eq('slug', slug).limit(1);
  if ((clash.data?.length ?? 0) > 0) slug = `${slug}-${input.userId.slice(0, 4)}`;

  const created = await supabase
    .from('organizations')
    .insert({ owner_id: input.userId, name: input.orgName, slug, country: input.country ?? 'US', currency: input.currency ?? 'USD' })
    .select('*')
    .single();
  if (created.error) throw created.error;
  return created.data;
}
