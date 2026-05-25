import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProductForCurrentUser } from '@/repositories/product-repository';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';
import { emitEvent } from '@/lib/automation/sdk';

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', correlationId);

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.organization_id) return NextResponse.json({ products: [] });

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ products: products ?? [] });
  } catch (error) {
    return errorResponse(500, 'PRODUCTS_FETCH_FAILED', 'Failed to fetch products', correlationId);
  }
}

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const body = await req.json();
    const product = await createProductForCurrentUser(body);
    logApiEvent('info', 'products.create_success', { correlationId, productId: product.id });

    // Emit automation event for PRD-01 workflow (fire-and-forget)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (creatorProfile?.id) {
        void emitEvent('product_created', {
          tenantId: product.organization_id,
          creatorId: creatorProfile.id,
          correlationId,
        }, {
          productId:   product.id,
          productName: product.title,
          price:       product.price,
        }, `product_created:${product.id}`)
      }
    }

    return NextResponse.json({ product, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'products.create_failed', { correlationId, message: error instanceof Error ? error.message : 'Product creation failed' });
    return errorResponse(400, 'PRODUCT_CREATE_FAILED', 'Product creation failed', correlationId);
  }
}
