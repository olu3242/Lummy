import { NextResponse, type NextRequest } from 'next/server';
import { duplicateProduct } from '@/services/product-service';

// POST /api/products/:id/duplicate — creates a draft copy via the canonical service
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await duplicateProduct(params.id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Duplicate failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Product not found' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
