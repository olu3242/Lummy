-- Critical tenant leak: migration 040 added "orders public track" (using (true))
-- so the order-tracking route could read orders without auth. That policy grants
-- SELECT on every column of every row in `orders` to anyone with the anon key —
-- not a single order by id, but an unfiltered table scan exposing customer
-- name/email/phone/address/amount across every creator's tenant.
--
-- src/app/track/[orderId]/page.tsx already reads via supabaseAdmin() (service role,
-- bypasses RLS), so the public policy is unnecessary for that route. The existing
-- "orders org" policy (also from migration 040) already covers legitimate
-- creator-side access via is_org_member(organization_id).

drop policy if exists "orders public track" on public.orders;
