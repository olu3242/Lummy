import { createClient } from '@/lib/supabase/server';



type SourcePlatform = 'Instagram' | 'TikTok' | 'WhatsApp' | 'Facebook' | 'Twitter/X' | 'YouTube' | 'Direct' | 'Referral';

function normalizeSourcePlatform(value?: string | null): SourcePlatform {
  const v = String(value || '').toLowerCase();
  if (v.includes('instagram')) return 'Instagram';
  if (v.includes('tiktok')) return 'TikTok';
  if (v.includes('whatsapp')) return 'WhatsApp';
  if (v.includes('facebook')) return 'Facebook';
  if (v.includes('twitter') || v.includes('x.com')) return 'Twitter/X';
  if (v.includes('youtube')) return 'YouTube';
  if (v.includes('referral')) return 'Referral';
  return 'Direct';
}

type CreateOrderInput = {
  organizationId: string;
  productId: string;
  customerEmail: string;
  quantity: number;
  provider: 'stripe' | 'paystack';
};

export async function createPendingOrder(input: CreateOrderInput, client?: ReturnType<typeof createClient>) {
  const supabase = client ?? createClient();
  const product = await supabase.from('products').select('id,title,price,currency,organization_id,status').eq('id', input.productId).eq('organization_id', input.organizationId).maybeSingle();
  if (product.error) throw product.error;
  if (!product.data || product.data.status !== 'active') throw new Error('Product unavailable');

  const quantity = Number.isFinite(input.quantity) ? Math.max(1, Math.floor(input.quantity)) : 1;
  const amount = Number(product.data.price) * quantity;

  const order = await supabase.from('orders').insert({ organization_id: input.organizationId, customer_email: input.customerEmail, status: 'pending', amount, currency: product.data.currency || 'USD', payment_provider: input.provider }).select('*').single();
  if (order.error) throw order.error;

  const payment = await supabase.from('payments').insert({ order_id: order.data.id, organization_id: input.organizationId, provider: input.provider, amount, currency: product.data.currency || 'USD', status: 'pending' }).select('*').single();
  if (payment.error) throw payment.error;

  return { order: order.data, payment: payment.data, product: product.data, quantity };
}

export async function markPaymentCompleted(params: { orderId: string; paymentId: string; providerReference: string; providerEventId: string; }) {
  const supabase = createClient();

  // Attempt to atomically (best-effort) update payment status only if not already succeeded
  const paymentUpdate = await supabase
    .from('payments')
    .update({ status: 'succeeded', provider_reference: params.providerReference, provider_event_id: params.providerEventId, paid_at: new Date().toISOString() })
    .eq('id', params.paymentId)
    .eq('order_id', params.orderId)
    .neq('status', 'succeeded')
    .select('*')
    .maybeSingle();
  if (paymentUpdate.error) throw paymentUpdate.error;
  if (!paymentUpdate.data) {
    // nothing updated — either already succeeded or not found
    throw new Error('Payment could not be updated (already succeeded or not found)');
  }

  // Only transition order to `paid` from non-paid states
  const orderUpdate = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', params.orderId)
    .neq('status', 'paid')
    .select('*')
    .maybeSingle();
  if (orderUpdate.error) {
    // Attempt to surface a clear error — payment was updated but order transition failed
    throw orderUpdate.error;
  }

  return { payment: paymentUpdate.data, order: orderUpdate.data };
}

export async function updatePaymentStatusConditionally(paymentId: string, allowedFrom: string[], toStatus: string, extras: Record<string, any> = {}) {
  const supabase = await createClient();
  const q = supabase.from('payments').update({ status: toStatus, ...extras }).eq('id', paymentId).in('status', allowedFrom).select('*').maybeSingle();
  const res = await q;
  if (res.error) throw res.error;
  return res.data || null;
}

export async function updateOrderStatusConditionally(orderId: string, allowedFrom: string[], toStatus: string) {
  const supabase = await createClient();
  const res = await supabase.from('orders').update({ status: toStatus }).eq('id', orderId).in('status', allowedFrom).select('*').maybeSingle();
  if (res.error) throw res.error;
  return res.data || null;
}

async function getCurrentOrgId() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');
  const membership = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membership.error) throw membership.error;
  return { supabase, organizationId: membership.data?.organization_id ?? null };
}

export async function getDashboardPayments(limit = 20) {
  const { supabase, organizationId } = await getCurrentOrgId();
  if (!organizationId) return [];
  const rows = await supabase.from('payments').select('id,order_id,status,amount,currency,provider,paid_at,created_at,orders!inner(customer_email,status,organization_id)').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(limit);
  if (rows.error) throw rows.error;
  return rows.data;
}

export async function getDashboardPaymentSummary() {
  const { supabase, organizationId } = await getCurrentOrgId();
  if (!organizationId) return { totalRevenue: 0, pendingRevenue: 0, totalOrders: 0, paidOrders: 0, pendingPayments: 0, failedPayments: 0, conversionRate: 0, sources: [] as Array<{ name: string; value: number; color: string }>, recentRevenue: [] as Array<{ label: string; revenue: number; orders: number }> };

  const payments = await supabase.from('payments').select('status,amount,provider,created_at').eq('organization_id', organizationId);
  if (payments.error) throw payments.error;
  const orders = await supabase.from('orders').select('id,status,created_at').eq('organization_id', organizationId);
  if (orders.error) throw orders.error;

  const totalRevenue = (payments.data ?? []).filter((p) => p.status === 'succeeded').reduce((a, p) => a + Number(p.amount), 0);
  const totalOrders = (orders.data ?? []).length;
  const paidOrders = (orders.data ?? []).filter((o) => o.status === 'paid').length;
  const failedPayments = (payments.data ?? []).filter((p) => p.status === 'failed').length;
  const pendingPayments = (payments.data ?? []).filter((p) => p.status === 'pending').length;
  const pendingRevenue = (payments.data ?? []).filter((p) => p.status === 'pending').reduce((a, p) => a + Number(p.amount), 0);
  const conversionRate = totalOrders > 0 ? Number(((paidOrders / totalOrders) * 100).toFixed(1)) : 0;

  const providerCounts = new Map<string, number>();
  for (const p of payments.data ?? []) providerCounts.set(p.provider, (providerCounts.get(p.provider) ?? 0) + 1);
  const providerTotal = Array.from(providerCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const palette: Record<string, string> = { paystack: '#25D366', stripe: '#6C4EF3' };
  const sources = Array.from(providerCounts.entries()).map(([name, count]) => ({ name: name[0].toUpperCase() + name.slice(1), value: Math.round((count / providerTotal) * 100), color: palette[name] ?? '#F97316' }));

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const p of payments.data ?? []) {
    const day = new Date(p.created_at).toISOString().slice(0, 10);
    const row = byDay.get(day) ?? { revenue: 0, orders: 0 };
    if (p.status === 'succeeded') row.revenue += Number(p.amount);
    row.orders += 1;
    byDay.set(day, row);
  }
  const recentRevenue = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([label, v]) => ({ label: label.slice(5), revenue: v.revenue, orders: v.orders }));

  return { totalRevenue, pendingRevenue, totalOrders, paidOrders, pendingPayments, failedPayments, conversionRate, sources, recentRevenue };
}

export async function getAiConversionSummary() {
  const { supabase, organizationId } = await getCurrentOrgId();
  if (!organizationId) return { activeInquiries: 0, pricingRequests: 0, checkoutGenerated: 0, abandoned: 0, recovered: 0, checkoutReady: 0, aiInsights: [] as string[] };

  const interactions = await supabase
    .from('customer_interactions')
    .select('id,conversion_status,source_channel')
    .eq('org_id', organizationId)
    .eq('source_channel', 'whatsapp');
  if (interactions.error) throw interactions.error;

  const recovery = await supabase
    .from('conversion_recovery_queue')
    .select('id,recovery_status')
    .eq('org_id', organizationId);
  if (recovery.error) throw recovery.error;

  const attribution = await supabase
    .from('conversion_attribution')
    .select('source_platform,conversion_type,conversion_status,revenue_amount')
    .eq('org_id', organizationId);
  if (attribution.error) throw attribution.error;

  const rows = interactions.data ?? [];
  const activeInquiries = rows.filter((r) => r.conversion_status === 'new' || r.conversion_status === 'intent_detected').length;
  const pricingRequests = rows.filter((r) => r.conversion_status === 'intent_detected').length;
  const checkoutGenerated = rows.filter((r) => r.conversion_status === 'checkout_generated').length;
  const abandoned = (recovery.data ?? []).filter((r) => r.recovery_status === 'pending').length;
  const recovered = (recovery.data ?? []).filter((r) => r.recovery_status === 'completed').length;
  const bySource = new Map<string, { revenue: number; checkouts: number }>();
  for (const row of attribution.data ?? []) {
    const key = row.source_platform || 'Direct';
    const current = bySource.get(key) ?? { revenue: 0, checkouts: 0 };
    if (row.conversion_type === 'payment' || row.conversion_status === 'payment_completed') current.revenue += Number(row.revenue_amount || 0);
    if (row.conversion_type === 'checkout' || row.conversion_status === 'checkout_generated') current.checkouts += 1;
    bySource.set(key, current);
  }
  const topRevenueSource = Array.from(bySource.entries()).sort((a, b) => b[1].revenue - a[1].revenue)[0];
  const topCheckoutSource = Array.from(bySource.entries()).sort((a, b) => b[1].checkouts - a[1].checkouts)[0];

  const aiInsights = [
    `${pricingRequests} customers requested pricing support.`,
    `${abandoned} abandoned checkouts likely recoverable.`,
    `${checkoutGenerated} checkout-ready customers in pipeline.`,
    topRevenueSource ? `${topRevenueSource[0]} generated highest attributed revenue.` : 'No payment attribution data yet.',
    topCheckoutSource ? `${topCheckoutSource[0]} drives the most checkout starts.` : 'No checkout source data yet.',
  ];
  return { activeInquiries, pricingRequests, checkoutGenerated, abandoned, recovered, checkoutReady: checkoutGenerated, aiInsights };
  ;
}



type MemoryLifecycle = 'new_lead' | 'active_customer' | 'repeat_customer' | 'high_value_customer' | 'inactive_customer' | 'abandoned_customer';

function generateCustomerSummary(input: { totalOrders: number; totalRevenue: number; paidOrders: number; checkoutGenerated: number; abandoned: number; }) {
  const notes: string[] = [];
  notes.push(input.totalOrders >= 2 ? 'Repeat buyer with multiple orders.' : 'Early-stage buyer profile.');
  if (input.abandoned > 0) notes.push(`Abandoned checkout signals: ${input.abandoned}.`);
  if (input.paidOrders > 0) notes.push(`Completed purchases: ${input.paidOrders}.`);
  if (input.totalRevenue > 0) notes.push(`Total revenue: ${Math.round(input.totalRevenue).toLocaleString()} in the creator's store currency.`);
  if (input.checkoutGenerated > input.paidOrders) notes.push('Follow-up recommended to improve conversion.');
  return notes.join(' ').slice(0, 240);
}

function resolveLifecycle(input: { totalOrders: number; totalRevenue: number; lastInteractionAt?: string | null; abandoned: number; }): MemoryLifecycle {
  if (input.totalRevenue >= 500000) return 'high_value_customer';
  if (input.totalOrders >= 2) return 'repeat_customer';
  if (input.abandoned > 0) return 'abandoned_customer';
  if (input.totalOrders >= 1) return 'active_customer';
  if (input.lastInteractionAt) {
    const ageMs = Date.now() - new Date(input.lastInteractionAt).getTime();
    if (ageMs > 1000 * 60 * 60 * 24 * 30) return 'inactive_customer';
  }
  return 'new_lead';
}


async function resolveOrganizationStorefrontId(orgId: string) {
  const supabase = createClient();
  const storefront = await supabase
    .from('storefronts')
    .select('id')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (storefront.error) throw storefront.error;
  return storefront.data?.id ?? null;
}

export async function upsertCustomerMemoryFromInteraction(input: { orgId: string; storefrontId?: string; customerIdentifier: string; email?: string; phone?: string; preferredChannel?: string; interactionId: string; correlationId?: string; }) {
  const supabase = createClient();
  const now = new Date().toISOString();
  const existing = await supabase.from('customer_profiles').select('*').eq('org_id', input.orgId).eq('customer_identifier', input.customerIdentifier).maybeSingle();
  if (existing.error) throw existing.error;

  const profile = existing.data
    ? await supabase.from('customer_profiles').update({ email: input.email ?? existing.data.email, phone: input.phone ?? existing.data.phone, preferred_channel: input.preferredChannel ?? existing.data.preferred_channel, last_interaction_at: now, updated_at: now }).eq('id', existing.data.id).select('*').single()
    : await supabase.from('customer_profiles').insert({ org_id: input.orgId, storefront_id: input.storefrontId ?? await resolveOrganizationStorefrontId(input.orgId), customer_identifier: input.customerIdentifier, email: input.email ?? null, phone: input.phone ?? null, preferred_channel: input.preferredChannel ?? 'whatsapp', first_interaction_at: now, last_interaction_at: now }).select('*').single();
  if (profile.error) throw profile.error;

  await supabase.from('customer_timeline_events').insert({ org_id: input.orgId, customer_profile_id: profile.data.id, interaction_id: input.interactionId, event_type: 'inquiry', event_summary: 'Customer inquiry captured', correlation_id: input.correlationId ?? null, payload: {} });
  return profile.data;
}

export async function syncCustomerMemoryForOrder(input: { orgId: string; orderId: string; paymentId?: string; correlationId?: string; }) {
  const supabase = createClient();
  const order = await supabase.from('orders').select('id,organization_id,customer_email,status,amount,created_at').eq('id', input.orderId).eq('organization_id', input.orgId).maybeSingle();
  if (order.error || !order.data) throw order.error || new Error('Order not found');

  const identifier = order.data.customer_email || `order:${order.data.id}`;
  const existing = await supabase.from('customer_profiles').select('*').eq('org_id', input.orgId).eq('customer_identifier', identifier).maybeSingle();
  if (existing.error) throw existing.error;
  let profile = existing.data;
  if (!profile) {
    const created = await supabase.from('customer_profiles').insert({ org_id: input.orgId, storefront_id: await resolveOrganizationStorefrontId(input.orgId), customer_identifier: identifier, email: order.data.customer_email, preferred_channel: 'whatsapp', first_interaction_at: order.data.created_at, last_interaction_at: order.data.created_at }).select('*').single();
    if (created.error) throw created.error;
    profile = created.data;
  }

  const orders = await supabase.from('orders').select('id,status,amount').eq('organization_id', input.orgId).eq('customer_email', order.data.customer_email);
  if (orders.error) throw orders.error;
  const interactions = await supabase.from('customer_interactions').select('conversion_status').eq('org_id', input.orgId).eq('customer_identifier', identifier);
  if (interactions.error) throw interactions.error;

  const totalOrders = (orders.data ?? []).length;
  const paidOrders = (orders.data ?? []).filter((o) => o.status === 'paid').length;
  const totalRevenue = (orders.data ?? []).filter((o) => o.status === 'paid').reduce((a, o) => a + Number(o.amount), 0);
  const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
  const checkoutGenerated = (interactions.data ?? []).filter((i) => i.conversion_status === 'checkout_generated').length;
  const abandoned = Math.max(0, checkoutGenerated - paidOrders);

  const lifecycle = resolveLifecycle({ totalOrders, totalRevenue, lastInteractionAt: profile.last_interaction_at, abandoned });
  const summary = generateCustomerSummary({ totalOrders, totalRevenue, paidOrders, checkoutGenerated, abandoned });

  const updated = await supabase.from('customer_profiles').update({ total_orders: totalOrders, total_revenue: totalRevenue, average_order_value: Number(averageOrderValue.toFixed(2)), repeat_customer_status: totalOrders >= 2 ? 'repeat' : 'single', lifecycle_stage: lifecycle, ai_summary: summary, last_interaction_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', profile.id).select('*').single();
  if (updated.error) throw updated.error;

  await supabase.from('customer_timeline_events').insert({ org_id: input.orgId, customer_profile_id: profile.id, order_id: order.data.id, payment_id: input.paymentId ?? null, event_type: order.data.status === 'paid' ? 'purchase' : 'payment_attempt', event_summary: order.data.status === 'paid' ? 'Purchase completed' : 'Payment attempt recorded', correlation_id: input.correlationId ?? null, payload: { amount: order.data.amount, status: order.data.status } });
  return updated.data;
}

export async function getCustomerMemorySummary() {
  const { supabase, organizationId } = await getCurrentOrgId();
  if (!organizationId) return { repeatCustomers: 0, highValueCustomers: 0, inactiveCustomers: 0, abandonedBuyers: 0, recentBuyers: 0, opportunities: [] as string[] };
  const profiles = await supabase.from('customer_profiles').select('id,lifecycle_stage,total_orders,ai_summary').eq('org_id', organizationId);
  if (profiles.error) throw profiles.error;
  const rows = profiles.data ?? [];
  return {
    repeatCustomers: rows.filter((r) => r.lifecycle_stage === 'repeat_customer').length,
    highValueCustomers: rows.filter((r) => r.lifecycle_stage === 'high_value_customer').length,
    inactiveCustomers: rows.filter((r) => r.lifecycle_stage === 'inactive_customer').length,
    abandonedBuyers: rows.filter((r) => r.lifecycle_stage === 'abandoned_customer').length,
    recentBuyers: rows.filter((r) => r.total_orders > 0).length,
    opportunities: rows.slice(0, 3).map((r) => r.ai_summary || 'Follow-up opportunity detected.'),
  };
}


export async function getDashboardOpsSummary() {
  const { supabase, organizationId } = await getCurrentOrgId();
  if (!organizationId) return { staleInquiries: 0, unpaidOrders: 0, webhookIssues: 0, recoveryPending: 0 };
  const stale = await supabase.from('customer_interactions').select('id,created_at').eq('org_id', organizationId).eq('source_channel', 'whatsapp').in('conversion_status', ['new','intent_detected']);
  if (stale.error) throw stale.error;
  const unpaid = await supabase.from('orders').select('id,status').eq('organization_id', organizationId).neq('status','paid');
  if (unpaid.error) throw unpaid.error;
  const failures = await supabase.from('messaging_failures').select('id,created_at').eq('tenant_id', organizationId).limit(200);
  const recovery = await supabase.from('conversion_recovery_queue').select('id,recovery_status').eq('org_id', organizationId).eq('recovery_status','pending');
  return { staleInquiries: (stale.data ?? []).length, unpaidOrders: (unpaid.data ?? []).length, webhookIssues: (failures.data ?? []).length, recoveryPending: (recovery.data ?? []).length };
}


export async function upsertConversionAttribution(input: {
  orgId: string;
  storefrontId?: string | null;
  interactionId?: string | null;
  checkoutId?: string | null;
  orderId?: string | null;
  customerIdentifier?: string | null;
  sourcePlatform?: string | null;
  sourceCampaign?: string | null;
  sourceContentReference?: string | null;
  referralCode?: string | null;
  conversionType: 'inquiry' | 'checkout' | 'payment' | 'recovery';
  conversionStatus: string;
  revenueAmount?: number;
}) {
  const supabase = createClient();
  let customerId: string | null = null;
  if (input.customerIdentifier) {
    const profile = await supabase.from('customer_profiles').select('id').eq('org_id', input.orgId).eq('customer_identifier', input.customerIdentifier).maybeSingle();
    if (!profile.error) customerId = profile.data?.id ?? null;
  }

  const payload = {
    org_id: input.orgId,
    storefront_id: input.storefrontId ?? null,
    customer_id: customerId,
    interaction_id: input.interactionId ?? null,
    checkout_id: input.checkoutId ?? null,
    order_id: input.orderId ?? input.checkoutId ?? null,
    source_platform: normalizeSourcePlatform(input.sourcePlatform),
    source_campaign: input.sourceCampaign ?? null,
    source_content_reference: input.sourceContentReference ?? null,
    referral_code: input.referralCode ?? null,
    conversion_type: input.conversionType,
    revenue_amount: input.revenueAmount ?? 0,
    conversion_status: input.conversionStatus,
    updated_at: new Date().toISOString(),
  };

  if (input.interactionId) {
    const existing = await supabase.from('conversion_attribution').select('id').eq('interaction_id', input.interactionId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data?.id) {
      const updated = await supabase.from('conversion_attribution').update(payload).eq('id', existing.data.id).select('*').single();
      if (updated.error) throw updated.error;
      return updated.data;
    }
  }

  const created = await supabase.from('conversion_attribution').insert(payload).select('*').single();
  if (created.error) throw created.error;
  return created.data;
}


export async function getGrowthIntelligenceSummary() {
  const { supabase, organizationId } = await getCurrentOrgId();
  if (!organizationId) {
    return {
      topProduct: null as null | { id: string; title: string; revenue: number; orders: number },
      lowPerformingProducts: [] as Array<{ id: string; title: string; orders: number }>,
      repeatPurchaseProducts: [] as Array<{ id: string; title: string; repeatOrders: number }>,
      highValueSegment: 'none',
      reorderOpportunities: [] as string[],
      upsellOpportunities: [] as string[],
      growthInsights: [] as string[],
    };
  }

  const orders = await supabase
    .from('orders')
    .select('id,organization_id,status,amount,customer_email,created_at,order_items(product_id,quantity,price_at_time,products(id,title,organization_id))')
    .eq('organization_id', organizationId);
  if (orders.error) throw orders.error;

  const attribution = await supabase
    .from('conversion_attribution')
    .select('source_platform,conversion_type,conversion_status,revenue_amount')
    .eq('org_id', organizationId);
  if (attribution.error) throw attribution.error;

  const profiles = await supabase
    .from('customer_profiles')
    .select('lifecycle_stage,total_orders,total_revenue')
    .eq('org_id', organizationId);
  if (profiles.error) throw profiles.error;

  const productMap = new Map<string, { title: string; revenue: number; orders: number; repeatOrders: number; pending: number }>();
  const customerProduct = new Map<string, Map<string, number>>();

  for (const o of orders.data ?? []) {
    const items = Array.isArray(o.order_items) ? o.order_items : [];
    const isPaid = o.status === 'paid';
    for (const item of items) {
      const pid = item?.product_id;
      const productData = Array.isArray(item?.products) ? item.products[0] : item?.products;
      const ptitle = productData?.title || 'Unknown product';
      if (!pid) continue;
      const row = productMap.get(pid) ?? { title: ptitle, revenue: 0, orders: 0, repeatOrders: 0, pending: 0 };
      row.orders += 1;
      if (isPaid) row.revenue += Number(item?.price_at_time || 0) * Number(item?.quantity || 1);
      else row.pending += 1;
      productMap.set(pid, row);

      const ckey = o.customer_email || 'unknown';
      const pCount = customerProduct.get(ckey) ?? new Map();
      pCount.set(pid, (pCount.get(pid) ?? 0) + 1);
      customerProduct.set(ckey, pCount);
    }
  }

  for (const byProduct of customerProduct.values()) {
    for (const [pid, count] of byProduct.entries()) {
      if (count >= 2) {
        const row = productMap.get(pid);
        if (row) row.repeatOrders += 1;
      }
    }
  }

  const products = Array.from(productMap.entries()).map(([id, v]) => ({ id, ...v }));
  const topProduct = products.sort((a,b)=>b.revenue-a.revenue)[0] ?? null;
  const lowPerformingProducts = products.filter((p)=>p.orders <= 1 || p.pending > p.orders / 2).slice(0,3).map(({id,title,orders})=>({id,title,orders}));
  const repeatPurchaseProducts = products.filter((p)=>p.repeatOrders>0).sort((a,b)=>b.repeatOrders-a.repeatOrders).slice(0,3).map(({id,title,repeatOrders})=>({id,title,repeatOrders}));

  const highValue = (profiles.data ?? []).filter((p)=>p.lifecycle_stage==='high_value_customer').length;
  const repeat = (profiles.data ?? []).filter((p)=>p.lifecycle_stage==='repeat_customer').length;
  const atRisk = (profiles.data ?? []).filter((p)=>p.lifecycle_stage==='abandoned_customer' || p.lifecycle_stage==='inactive_customer').length;
  const highValueSegment = highValue > 0 ? 'high_value_customer' : repeat > atRisk ? 'repeat_buyer' : atRisk > 0 ? 'at_risk_customer' : 'high_intent_lead';

  const sourceTotals = new Map<string, number>();
  for (const a of attribution.data ?? []) {
    if (a.conversion_type === 'payment' || a.conversion_status === 'payment_completed') {
      sourceTotals.set(a.source_platform || 'Direct', (sourceTotals.get(a.source_platform || 'Direct') ?? 0) + Number(a.revenue_amount || 0));
    }
  }
  const topSource = Array.from(sourceTotals.entries()).sort((a,b)=>b[1]-a[1])[0];

  const reorderOpportunities = repeatPurchaseProducts.map((p)=>`Reorder prompt: buyers repeatedly purchase ${p.title}.`);
  const upsellOpportunities = topProduct ? [`Upsell prompt: pair ${topProduct.title} with a complementary add-on.`] : [];
  const growthInsights = [
    topProduct ? `${topProduct.title} is the highest revenue generator.` : 'No paid product revenue yet.',
    topSource ? `${topSource[0]} is the highest converting revenue source.` : 'No source revenue attribution yet.',
    lowPerformingProducts[0] ? `${lowPerformingProducts[0].title} is underperforming and needs offer refinement.` : 'No low-performing product detected.',
    repeatPurchaseProducts[0] ? `${repeatPurchaseProducts[0].title} has repeat purchase momentum.` : 'No repeat purchase pattern detected yet.',
  ];

  return { topProduct, lowPerformingProducts, repeatPurchaseProducts, highValueSegment, reorderOpportunities, upsellOpportunities, growthInsights };
}
