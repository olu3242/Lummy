import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  parseCsv,
  suggestColumnMapping,
  applyColumnMapping,
  validateImportRows,
  type ImportField,
  type RawImportRow,
} from '@/services/product-import';
import { importProducts, listImportJobs, resolveOrgContext } from '@/services/product-service';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 2000;

function parseUpload(fileName: string, buffer: Buffer): { headers: string[]; rows: RawImportRow[]; fileType: 'csv' | 'xlsx' } {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return { headers: [], rows: [], fileType: 'xlsx' };
    const json = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: '' });
    const headers = json.length > 0 ? Object.keys(json[0]) : [];
    return { headers, rows: json as RawImportRow[], fileType: 'xlsx' };
  }
  const { headers, rows } = parseCsv(buffer.toString('utf8'));
  return { headers, rows, fileType: 'csv' };
}

// GET /api/products/import — import job history
export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const jobs = await listImportJobs();
    return NextResponse.json({ jobs, correlationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list imports';
    if (message === 'Unauthorized') return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', correlationId);
    logApiEvent('error', 'products.import_history_failed', { correlationId, message });
    return errorResponse(500, 'IMPORT_HISTORY_FAILED', 'Failed to list imports', correlationId);
  }
}

// POST /api/products/import
// multipart/form-data: file, mode=preview|commit, mapping (JSON, optional)
// preview → parse + suggested mapping + validation preview (nothing written)
// commit  → validate + insert + record import job
export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const form = await req.formData();
    const file = form.get('file');
    const mode = String(form.get('mode') || 'preview');
    if (!(file instanceof File)) return errorResponse(400, 'MISSING_FILE', 'No file uploaded', correlationId);
    if (file.size > MAX_FILE_BYTES) return errorResponse(400, 'FILE_TOO_LARGE', 'File exceeds 5MB limit', correlationId);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { headers, rows, fileType } = parseUpload(file.name, buffer);
    if (headers.length === 0 || rows.length === 0) {
      return errorResponse(400, 'EMPTY_FILE', 'No data rows found in file', correlationId);
    }
    if (rows.length > MAX_ROWS) {
      return errorResponse(400, 'TOO_MANY_ROWS', `File has ${rows.length} rows; the limit is ${MAX_ROWS} per import`, correlationId);
    }

    const mappingRaw = form.get('mapping');
    const mapping: Record<string, ImportField | null> = mappingRaw
      ? JSON.parse(String(mappingRaw))
      : suggestColumnMapping(headers);

    const mappedRows = applyColumnMapping(rows, mapping);

    if (mode === 'commit') {
      const result = await importProducts(mappedRows, { fileName: file.name, fileType });
      logApiEvent('info', 'products.import_committed', { correlationId, jobId: result.jobId, imported: result.imported, failed: result.failed });
      return NextResponse.json({ ...result, correlationId });
    }

    // Preview: validate against the live catalog's sku/slug values (read-only)
    const { supabase, organizationId } = await resolveOrgContext();
    const existing = await supabase.from('products').select('sku,slug').eq('organization_id', organizationId);
    const existingSkus = new Set(((existing.data ?? []).map((p) => p.sku?.toLowerCase()).filter(Boolean)) as string[]);
    const existingSlugs = new Set(((existing.data ?? []).map((p) => p.slug).filter(Boolean)) as string[]);
    const { valid, errors, preview } = validateImportRows(mappedRows, { existingSkus, existingSlugs });

    return NextResponse.json({
      headers,
      mapping,
      totalRows: rows.length,
      validRows: valid.length,
      errorCount: errors.length,
      errors: errors.slice(0, 200),
      preview: preview.slice(0, 50),
      correlationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed';
    if (message === 'Unauthorized') return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', correlationId);
    logApiEvent('error', 'products.import_failed', { correlationId, message });
    return errorResponse(500, 'IMPORT_FAILED', 'Import failed', correlationId);
  }
}
