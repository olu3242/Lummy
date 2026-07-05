// Canonical Product Service — the ONLY module allowed to write to the
// products table. Every entry point (onboarding, dashboard quick action,
// products page, empty state, import, API routes) goes through here.
//
// Conventions:
// - price is ALWAYS stored in minor units (kobo/pesewas). Convert at the edge.
// - status: 'draft' | 'active' | 'archived'. Public storefront shows 'active'.
// - All calls run under the caller's authenticated session (anon client + RLS);
//   tenant scoping is enforced by both explicit organization_id filters and RLS.

import { createClient } from '@/lib/supabase/server';
import {
  validateImportRows,
  type ImportField,
  type ImportRowError,
  type NormalizedProductRow,
  slugify,
} from '@/services/product-import';

export type ProductInput = {
  title: string;
  price: number; // minor units (kobo)
  description?: string | null;
  image_url?: string | null;
  currency?: string;
  status?: 'draft' | 'active' | 'archived';
  sku?: string | null;
  slug?: string | null;
  category?: string | null;
  stock_quantity?: number | null;
};

export type ProductRecord = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  status: string;
  sku: string | null;
  slug: string | null;
  category: string | null;
  stock_quantity: number | null;
  created_at: string;
  updated_at: string | null;
};

// ── Org context ───────────────────────────────────────────────────────────────

export async function resolveOrgContext() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const profile = await supabase.from('profiles').select('organization_id').eq('id', auth.user.id).maybeSingle();
  if (profile.error) throw profile.error;
  if (!profile.data?.organization_id) throw new Error('No organization context');

  const orgId = profile.data.organization_id;
  const membership = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (membership.error) throw membership.error;
  if (!membership.data) throw new Error('Forbidden');

  return { supabase, organizationId: orgId, userId: auth.user.id };
}

function sanitizeInput(input: ProductInput): Record<string, unknown> {
  const title = String(input.title ?? '').trim();
  if (!title) throw new Error('Product title is required');
  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error('Product price must be a positive number (minor units)');

  return {
    title,
    description: input.description?.toString().trim() || null,
    price: Math.round(price),
    currency: (input.currency || 'NGN').toUpperCase(),
    image_url: input.image_url?.toString().trim() || null,
    status: input.status && ['draft', 'active', 'archived'].includes(input.status) ? input.status : 'active',
    sku: input.sku?.toString().trim() || null,
    slug: input.slug ? slugify(String(input.slug)) : slugify(title) || null,
    category: input.category?.toString().trim() || null,
    stock_quantity: input.stock_quantity ?? null,
  };
}

// ── Canonical operations ──────────────────────────────────────────────────────

// organizationId variant exists for the onboarding server action, which has
// already resolved+validated the org. Same insert logic — no fork.
export async function createProduct(input: ProductInput, opts?: { organizationId?: string }): Promise<ProductRecord> {
  let supabase; let organizationId: string;
  if (opts?.organizationId) {
    supabase = createClient();
    organizationId = opts.organizationId;
  } else {
    ({ supabase, organizationId } = await resolveOrgContext());
  }

  const row = sanitizeInput(input);
  // Slug collision within org → auto-suffix rather than fail.
  if (row.slug) {
    const clash = await supabase.from('products').select('id').eq('organization_id', organizationId).eq('slug', row.slug).limit(1);
    if (!clash.error && (clash.data?.length ?? 0) > 0) row.slug = `${row.slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const created = await supabase
    .from('products')
    .insert({ organization_id: organizationId, ...row })
    .select('*')
    .single();
  if (created.error) throw created.error;
  return created.data as ProductRecord;
}

export async function updateProduct(productId: string, patch: Partial<ProductInput>): Promise<ProductRecord> {
  const { supabase, organizationId } = await resolveOrgContext();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) {
    const t = String(patch.title).trim();
    if (!t) throw new Error('Product title is required');
    update.title = t;
  }
  if (patch.description !== undefined) update.description = patch.description?.toString().trim() || null;
  if (patch.price !== undefined) {
    const p = Number(patch.price);
    if (!Number.isFinite(p) || p <= 0) throw new Error('Product price must be a positive number (minor units)');
    update.price = Math.round(p);
  }
  if (patch.currency !== undefined) update.currency = String(patch.currency).toUpperCase();
  if (patch.image_url !== undefined) update.image_url = patch.image_url?.toString().trim() || null;
  if (patch.status !== undefined) {
    if (!['draft', 'active', 'archived'].includes(patch.status)) throw new Error('Invalid status');
    update.status = patch.status;
  }
  if (patch.sku !== undefined) update.sku = patch.sku?.toString().trim() || null;
  if (patch.slug !== undefined) update.slug = patch.slug ? slugify(String(patch.slug)) : null;
  if (patch.category !== undefined) update.category = patch.category?.toString().trim() || null;
  if (patch.stock_quantity !== undefined) update.stock_quantity = patch.stock_quantity;

  const updated = await supabase
    .from('products')
    .update(update)
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .select('*')
    .maybeSingle();
  if (updated.error) throw updated.error;
  if (!updated.data) throw new Error('Product not found');
  return updated.data as ProductRecord;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { supabase, organizationId } = await resolveOrgContext();
  const del = await supabase.from('products').delete().eq('id', productId).eq('organization_id', organizationId);
  if (del.error) throw del.error;
}

export async function archiveProduct(productId: string): Promise<ProductRecord> {
  return updateProduct(productId, { status: 'archived' });
}

export async function publishProduct(productId: string): Promise<ProductRecord> {
  return updateProduct(productId, { status: 'active' });
}

export async function duplicateProduct(productId: string): Promise<ProductRecord> {
  const { supabase, organizationId } = await resolveOrgContext();
  const source = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (source.error) throw source.error;
  if (!source.data) throw new Error('Product not found');

  const src = source.data as ProductRecord;
  return createProduct({
    title: `${src.title} (Copy)`,
    description: src.description,
    price: Number(src.price),
    currency: src.currency,
    image_url: src.image_url,
    status: 'draft',
    sku: null, // sku must stay unique per org
    slug: null, // regenerated from the new title
    category: src.category,
    stock_quantity: src.stock_quantity,
  });
}

// ── Import / Export ───────────────────────────────────────────────────────────

export type ImportResult = {
  jobId: string | null;
  totalRows: number;
  imported: number;
  failed: number;
  errors: ImportRowError[];
};

export async function importProducts(
  mappedRows: Array<Partial<Record<ImportField, string | number | null | undefined>>>,
  meta: { fileName: string; fileType: 'csv' | 'xlsx' },
): Promise<ImportResult> {
  const { supabase, organizationId, userId } = await resolveOrgContext();

  // Existing sku/slug values for duplicate detection against the live catalog.
  const existing = await supabase.from('products').select('sku,slug').eq('organization_id', organizationId);
  if (existing.error) throw existing.error;
  const existingSkus = new Set((existing.data ?? []).map((p) => p.sku?.toLowerCase()).filter(Boolean) as string[]);
  const existingSlugs = new Set((existing.data ?? []).map((p) => p.slug).filter(Boolean) as string[]);

  const { valid, errors } = validateImportRows(mappedRows, { existingSkus, existingSlugs });

  let imported = 0;
  if (valid.length > 0) {
    // Chunked inserts so one bad chunk doesn't void the whole import.
    const CHUNK = 100;
    for (let i = 0; i < valid.length; i += CHUNK) {
      const chunk = valid.slice(i, i + CHUNK).map((r: NormalizedProductRow) => ({ organization_id: organizationId, ...r }));
      const ins = await supabase.from('products').insert(chunk).select('id');
      if (ins.error) {
        errors.push({ row: i + 1, field: 'batch', message: `Insert failed for rows ${i + 1}-${i + chunk.length}: ${ins.error.message}` });
      } else {
        imported += ins.data?.length ?? chunk.length;
      }
    }
  }

  const failed = mappedRows.length - imported;
  const job = await supabase
    .from('product_import_jobs')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      file_name: meta.fileName,
      file_type: meta.fileType,
      total_rows: mappedRows.length,
      imported_rows: imported,
      failed_rows: failed,
      status: failed === 0 ? 'completed' : imported === 0 ? 'failed' : 'partial',
      error_report: errors.slice(0, 500),
    })
    .select('id')
    .maybeSingle();

  return { jobId: job.data?.id ?? null, totalRows: mappedRows.length, imported, failed, errors };
}

export async function exportProducts(): Promise<string> {
  const { supabase, organizationId } = await resolveOrgContext();
  const rows = await supabase
    .from('products')
    .select('title,description,price,currency,sku,slug,category,image_url,stock_quantity,status,created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (rows.error) throw rows.error;

  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = 'title,description,price,currency,sku,slug,category,image_url,stock_quantity,status,created_at';
  const lines = (rows.data ?? []).map((p) =>
    [p.title, p.description, (Number(p.price) / 100).toFixed(2), p.currency, p.sku, p.slug, p.category, p.image_url, p.stock_quantity, p.status, p.created_at]
      .map(esc).join(','),
  );
  return [header, ...lines].join('\n');
}

export async function listImportJobs(limit = 50) {
  const { supabase, organizationId } = await resolveOrgContext();
  const jobs = await supabase
    .from('product_import_jobs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (jobs.error) throw jobs.error;
  return jobs.data ?? [];
}
