// Pure, dependency-free import validation + normalization.
// Server and client safe (no supabase imports) so the wizard can preview
// with exactly the same rules the server enforces.

export type RawImportRow = Record<string, string | number | null | undefined>;

export type ImportRowError = {
  row: number; // 1-based data row number (excluding header)
  field: string;
  message: string;
};

export type NormalizedProductRow = {
  title: string;
  description: string | null;
  price: number; // minor units (kobo)
  currency: string;
  sku: string | null;
  slug: string | null;
  category: string | null;
  image_url: string | null;
  stock_quantity: number | null;
  status: 'draft' | 'active';
};

export const IMPORT_FIELDS = [
  'title',
  'description',
  'price',
  'currency',
  'sku',
  'slug',
  'category',
  'image_url',
  'stock_quantity',
  'status',
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

// Header aliases for auto column-mapping.
const HEADER_ALIASES: Record<string, ImportField> = {
  title: 'title', name: 'title', 'product name': 'title', 'product title': 'title', product: 'title',
  description: 'description', desc: 'description', details: 'description',
  price: 'price', amount: 'price', 'price (ngn)': 'price', 'price ngn': 'price', 'unit price': 'price', cost: 'price',
  currency: 'currency',
  sku: 'sku', 'stock keeping unit': 'sku', code: 'sku', 'product code': 'sku',
  slug: 'slug', handle: 'slug', 'url slug': 'slug',
  category: 'category', type: 'category', collection: 'category',
  image: 'image_url', image_url: 'image_url', 'image url': 'image_url', photo: 'image_url', picture: 'image_url',
  stock: 'stock_quantity', quantity: 'stock_quantity', qty: 'stock_quantity', stock_quantity: 'stock_quantity', inventory: 'stock_quantity',
  status: 'status', published: 'status', visibility: 'status',
};

export function suggestColumnMapping(headers: string[]): Record<string, ImportField | null> {
  const mapping: Record<string, ImportField | null> = {};
  const used = new Set<ImportField>();
  for (const header of headers) {
    const key = header.toLowerCase().trim();
    const field = HEADER_ALIASES[key] ?? null;
    if (field && !used.has(field)) {
      mapping[header] = field;
      used.add(field);
    } else {
      mapping[header] = null;
    }
  }
  return mapping;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

const SUPPORTED_CURRENCIES = new Set(['NGN', 'GHS', 'KES', 'ZAR', 'USD']);

export type ValidateOptions = {
  existingSkus?: Set<string>;
  existingSlugs?: Set<string>;
  requireCategory?: boolean;
  requireImage?: boolean;
};

export type ValidationResult = {
  valid: NormalizedProductRow[];
  errors: ImportRowError[];
  // Row index (1-based) → normalized row, including invalid ones where possible (for preview)
  preview: Array<{ row: number; data: Partial<NormalizedProductRow>; errors: ImportRowError[] }>;
};

// Validate mapped rows. `rows` values are keyed by canonical ImportField.
export function validateImportRows(
  rows: Array<Partial<Record<ImportField, string | number | null | undefined>>>,
  opts: ValidateOptions = {},
): ValidationResult {
  const errors: ImportRowError[] = [];
  const valid: NormalizedProductRow[] = [];
  const preview: ValidationResult['preview'] = [];
  const seenSkus = new Set<string>(opts.existingSkus ?? []);
  const seenSlugs = new Set<string>(opts.existingSlugs ?? []);

  rows.forEach((raw, i) => {
    const row = i + 1;
    const rowErrors: ImportRowError[] = [];
    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

    const title = str(raw.title);
    if (!title) rowErrors.push({ row, field: 'title', message: 'Missing title' });
    else if (title.length > 200) rowErrors.push({ row, field: 'title', message: 'Title exceeds 200 characters' });

    // Price is authored in major units (naira) in the sheet; stored in minor units (kobo).
    const priceRaw = str(raw.price).replace(/[₦,\s]/g, '');
    const priceMajor = Number(priceRaw);
    let price = 0;
    if (!priceRaw || !Number.isFinite(priceMajor) || priceMajor <= 0) {
      rowErrors.push({ row, field: 'price', message: `Invalid price "${str(raw.price)}" — must be a positive number` });
    } else {
      price = Math.round(priceMajor * 100);
    }

    const currency = (str(raw.currency) || 'NGN').toUpperCase();
    if (!SUPPORTED_CURRENCIES.has(currency)) {
      rowErrors.push({ row, field: 'currency', message: `Unsupported currency "${currency}"` });
    }

    const sku = str(raw.sku) || null;
    if (sku) {
      const skuKey = sku.toLowerCase();
      if (seenSkus.has(skuKey)) rowErrors.push({ row, field: 'sku', message: `Duplicate SKU "${sku}"` });
      else seenSkus.add(skuKey);
    }

    let slug = str(raw.slug) ? slugify(str(raw.slug)) : title ? slugify(title) : null;
    if (slug) {
      if (seenSlugs.has(slug)) {
        // Auto-suffix duplicate slugs derived from titles; hard-fail explicit duplicates.
        if (str(raw.slug)) {
          rowErrors.push({ row, field: 'slug', message: `Duplicate slug "${slug}"` });
        } else {
          let n = 2;
          while (seenSlugs.has(`${slug}-${n}`)) n += 1;
          slug = `${slug}-${n}`;
          seenSlugs.add(slug);
        }
      } else {
        seenSlugs.add(slug);
      }
    }

    const category = str(raw.category) || null;
    if (opts.requireCategory && !category) rowErrors.push({ row, field: 'category', message: 'Missing category' });

    const image_url = str(raw.image_url) || null;
    if (image_url && !/^https?:\/\//i.test(image_url)) {
      rowErrors.push({ row, field: 'image_url', message: `Image URL must start with http(s): "${image_url.slice(0, 60)}"` });
    }
    if (opts.requireImage && !image_url) rowErrors.push({ row, field: 'image_url', message: 'Missing image' });

    const stockRaw = str(raw.stock_quantity);
    let stock_quantity: number | null = null;
    if (stockRaw) {
      const n = Number(stockRaw);
      if (!Number.isInteger(n) || n < 0) rowErrors.push({ row, field: 'stock_quantity', message: `Invalid stock quantity "${stockRaw}"` });
      else stock_quantity = n;
    }

    const statusRaw = str(raw.status).toLowerCase();
    const status: 'draft' | 'active' =
      ['active', 'published', 'true', 'yes', 'live'].includes(statusRaw) ? 'active' : 'draft';

    const data: Partial<NormalizedProductRow> = {
      title: title || undefined,
      description: str(raw.description) || null,
      price: price || undefined,
      currency,
      sku,
      slug,
      category,
      image_url,
      stock_quantity,
      status,
    };
    preview.push({ row, data, errors: rowErrors });

    if (rowErrors.length === 0) {
      valid.push(data as NormalizedProductRow);
    } else {
      errors.push(...rowErrors);
    }
  });

  return { valid, errors, preview };
}

// RFC 4180 CSV parser (quotes, escaped quotes, commas and newlines in fields).
export function parseCsv(text: string): { headers: string[]; rows: RawImportRow[] } {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // strip BOM

  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      record.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      record.push(field); field = '';
      if (record.some((f) => f.trim() !== '')) records.push(record);
      record = [];
    } else {
      field += c;
    }
  }
  record.push(field);
  if (record.some((f) => f.trim() !== '')) records.push(record);

  if (records.length === 0) return { headers: [], rows: [] };
  const headers = records[0].map((h) => h.trim());
  const rows = records.slice(1).map((rec) => {
    const row: RawImportRow = {};
    headers.forEach((h, idx) => { row[h] = rec[idx] ?? ''; });
    return row;
  });
  return { headers, rows };
}

export function applyColumnMapping(
  rows: RawImportRow[],
  mapping: Record<string, ImportField | null>,
): Array<Partial<Record<ImportField, string | number | null | undefined>>> {
  return rows.map((row) => {
    const mapped: Partial<Record<ImportField, string | number | null | undefined>> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (field) mapped[field] = row[header];
    }
    return mapped;
  });
}
