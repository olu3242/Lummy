import { exportProducts } from '@/services/product-service';
import { errorResponse, getCorrelationId } from '@/lib/ops-observability';

// GET /api/products/export — full catalog as CSV (price in major units)
export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const csv = await exportProducts();
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="lummy-products-${new Date().toISOString().slice(0, 10)}.csv"`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    if (message === 'Unauthorized') return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', correlationId);
    return errorResponse(500, 'EXPORT_FAILED', 'Export failed', correlationId);
  }
}
