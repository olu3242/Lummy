#!/usr/bin/env node
/**
 * P0 Bootstrap Pipeline Certification
 *
 * Certifies the entire new-creator bootstrap pipeline against a REAL Supabase
 * project, with fresh users, exercising the same writes (as the same roles)
 * that the app performs:
 *
 *   1. Signup            (admin createUser — email pre-confirmed)
 *   2. Session           (anon-key signInWithPassword — real authenticated session)
 *   3. Bootstrap rows    (auth.users → public.users + profiles via DB trigger)
 *   4. Organization      (insert as the user — RLS "org visible to members" WITH CHECK owner_id)
 *   5. Membership        (insert as the user — RLS is_org_member via org ownership)
 *   6. Storefront        (upsert as the user — RLS is_org_member)
 *   7. Product           (insert as the user — RLS is_org_member)
 *   8. Profile complete  (upsert onboarding_completed — RLS "profiles self")
 *   9. creator_profiles  (upsert — RLS creators_insert_own)
 *  10. onboarding_states (upsert — RLS "onboarding_states self")
 *  11. Public storefront (read as ANONYMOUS visitor — RLS public-read policies)
 *  12. Cleanup           (service role — delete user; org rows cascade)
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/certify-bootstrap.mjs [runs=3] [--keep]
 *
 * Exit code 0 only if EVERY step passes for EVERY fresh user.
 */
import { createClient } from '@supabase/supabase-js';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RUNS = Number(process.argv[2]) || 3;
const KEEP = process.argv.includes('--keep');

if (!URL_ || !ANON || !SERVICE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

const rand = () => Math.random().toString(36).slice(2, 8);

async function certifyFreshUser(runIdx) {
  const tag = `bootcert-${Date.now()}-${rand()}`;
  const email = `${tag}@certify.lummy.local`;
  const password = `Cert!${rand()}${rand()}`;
  const handle = `cert-${rand()}${rand()}`.slice(0, 20);
  const results = [];
  const ok = (step, extra) => { results.push({ step, pass: true, extra }); console.log(`  ✓ ${step}${extra ? ` — ${extra}` : ''}`); };
  const fail = (step, err) => { results.push({ step, pass: false, err: String(err?.message ?? err) }); console.error(`  ✗ ${step} — ${err?.message ?? err}`); };

  console.log(`\n── Fresh User #${runIdx + 1}: ${email} (handle: ${handle})`);
  let userId = null, orgId = null;

  try {
    // 1. Signup
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Cert User ${runIdx + 1}`, handle } });
    if (created.error) return fail('signup', created.error), { results, userId, orgId };
    userId = created.data.user.id;
    ok('signup (auth.users)', userId);

    // 2. Authenticated session with the ANON key — everything below runs under RLS as this user
    const user = createClient(URL_, ANON, { auth: { persistSession: false } });
    const signIn = await user.auth.signInWithPassword({ email, password });
    if (signIn.error) return fail('session (signInWithPassword)', signIn.error), { results, userId, orgId };
    ok('session', `jwt for ${signIn.data.user.id}`);

    // 3. Bootstrap rows from the on_auth_user_created trigger (migration 053)
    for (const t of ['users', 'profiles']) {
      const row = await admin.from(t).select('id').eq('id', userId).maybeSingle();
      if (row.error || !row.data) { fail(`bootstrap row: public.${t} (trigger 053)`, row.error ?? 'row missing'); }
      else ok(`bootstrap row: public.${t}`);
    }

    // 4. Organization (mirrors ensureOrganizationForUser)
    const org = await user.from('organizations').insert({ owner_id: userId, name: `Cert Org ${tag}`, slug: `cert-${rand()}${rand()}`, country: 'NG', currency: 'NGN' }).select('*').single();
    if (org.error) return fail('organization insert (RLS: owner_id = auth.uid())', org.error), { results, userId, orgId };
    orgId = org.data.id;
    ok('organization insert', orgId);

    // 5. Membership
    const member = await user.from('organization_members').insert({ organization_id: orgId, user_id: userId, role: 'owner' });
    if (member.error) fail('membership insert (RLS: is_org_member)', member.error);
    else ok('membership insert');

    // 6. Storefront (mirrors upsertStorefront)
    const store = await user.from('storefronts').upsert({ organization_id: orgId, handle }, { onConflict: 'organization_id' }).select('id,handle,is_active').single();
    if (store.error) fail('storefront upsert (RLS: is_org_member)', store.error);
    else ok('storefront upsert', `${store.data.handle} active=${store.data.is_active}`);

    // 7. Product (mirrors createProduct — org-schema columns)
    const product = await user.from('products').insert({ organization_id: orgId, title: 'Cert Product', price: 5000, status: 'active' }).select('id').single();
    if (product.error) fail('product insert (RLS: is_org_member; schema: organization_id/title/status)', product.error);
    else ok('product insert', product.data.id);

    // 8. Profile completion (mirrors completeOnboarding profiles upsert)
    const prof = await user.from('profiles').upsert({ id: userId, email, onboarding_completed: true, onboarding_step: 'completed', organization_id: orgId }, { onConflict: 'id' });
    if (prof.error) fail('profiles completion upsert (RLS: profiles self)', prof.error);
    else ok('profiles completion upsert');

    // 9. creator_profiles (mirrors completeOnboarding legacy upsert)
    const cp = await user.from('creator_profiles').upsert({ user_id: userId, handle, business_name: `Cert Org ${tag}`, whatsapp_number: '+2348030000000', is_published: true, onboarding_completed: true }, { onConflict: 'user_id' });
    if (cp.error) fail('creator_profiles upsert (RLS: creators_insert_own)', cp.error);
    else ok('creator_profiles upsert');

    // 10. onboarding_states
    const st = await user.from('onboarding_states').upsert({ user_id: userId, organization_id: orgId, current_step: 'completed', completed: true }, { onConflict: 'user_id' });
    if (st.error) fail('onboarding_states upsert (RLS: self)', st.error);
    else ok('onboarding_states upsert');

    // 11. Public storefront as a fully anonymous visitor (no session)
    const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
    const pubStore = await anon.from('storefronts').select('handle,is_active,organization_id').eq('handle', handle).eq('is_active', true).maybeSingle();
    if (pubStore.error || !pubStore.data) fail('public storefront read (RLS: storefronts public read)', pubStore.error ?? 'not visible');
    else ok('public storefront read');
    const pubProducts = await anon.from('products').select('id,title,price').eq('organization_id', orgId).eq('status', 'active');
    if (pubProducts.error || (pubProducts.data ?? []).length === 0) fail('public products read (RLS: products public read)', pubProducts.error ?? '0 products visible');
    else ok('public products read', `${pubProducts.data.length} product(s)`);

    // 12. Product management columns (migration 061): sku/slug/category/stock/updated_at
    const enriched = await user.from('products').insert({
      organization_id: orgId, title: 'Cert Import Product', price: 150000, status: 'draft',
      sku: `CERT-${rand().toUpperCase()}`, slug: `cert-import-${rand()}`, category: 'Clothing', stock_quantity: 5,
    }).select('id,sku,slug').single();
    if (enriched.error) fail('product with sku/slug/category (migration 061 applied?)', enriched.error);
    else ok('product with sku/slug/category', enriched.data.id);

    // 13. Archive lifecycle: archived products must be hidden from the public storefront
    if (enriched.data?.id) {
      const archived = await user.from('products').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', enriched.data.id).eq('organization_id', orgId);
      if (archived.error) fail('archive product (status + updated_at)', archived.error);
      else {
        const pubArchived = await anon.from('products').select('id').eq('id', enriched.data.id).eq('status', 'archived');
        if ((pubArchived.data ?? []).length > 0) fail('archived product hidden from public', 'archived product publicly visible');
        else ok('archived product hidden from public');
      }
    }

    // 14. Import job history table (migration 061) under RLS
    const job = await user.from('product_import_jobs').insert({
      organization_id: orgId, user_id: userId, file_name: 'cert.csv', file_type: 'csv',
      total_rows: 1, imported_rows: 1, failed_rows: 0, status: 'completed', error_report: [],
    }).select('id').single();
    if (job.error) fail('product_import_jobs insert (migration 061 applied?)', job.error);
    else ok('product_import_jobs insert', job.data.id);

    await user.auth.signOut();
  } catch (e) {
    fail('unexpected exception', e);
  }
  return { results, userId, orgId };
}

async function cleanup(userId, orgId) {
  if (KEEP) return;
  try {
    if (orgId) await admin.from('organizations').delete().eq('id', orgId); // storefronts/products/orders cascade
    if (userId) {
      await admin.from('creator_profiles').delete().eq('user_id', userId);
      await admin.from('onboarding_states').delete().eq('user_id', userId);
      await admin.auth.admin.deleteUser(userId); // profiles/users cascade on delete
    }
  } catch (e) {
    console.warn(`  (cleanup warning: ${e?.message ?? e})`);
  }
}

const summary = [];
for (let i = 0; i < RUNS; i += 1) {
  const { results, userId, orgId } = await certifyFreshUser(i);
  await cleanup(userId, orgId);
  const failed = results.filter((r) => !r.pass);
  summary.push({ run: i + 1, passed: failed.length === 0, failed });
}

console.log('\n════════ BOOTSTRAP CERTIFICATION SUMMARY ════════');
for (const s of summary) {
  console.log(`Fresh User #${s.run}: ${s.passed ? 'PASS ✓' : `FAIL ✗ (${s.failed.map((f) => f.step).join('; ')})`}`);
}
const allPass = summary.every((s) => s.passed);
console.log(allPass ? `\nRESULT: PASS — ${RUNS}/${RUNS} consecutive fresh users completed the full bootstrap.` : '\nRESULT: FAIL — first failing step above identifies the break point.');
process.exit(allPass ? 0 : 1);
