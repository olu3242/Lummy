import { NextResponse } from 'next/server';
import { createProductForCurrentUser } from '@/repositories/product-repository';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const body = await req.json();
    const product = await createProductForCurrentUser(body);
    logApiEvent('info', 'products.create_success', { correlationId, productId: product.id });
    return NextResponse.json({ product, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'products.create_failed', { correlationId, message: error instanceof Error ? error.message : 'Product creation failed' });
    return errorResponse(400, 'PRODUCT_CREATE_FAILED', 'Product creation failed', correlationId);
  }
}
