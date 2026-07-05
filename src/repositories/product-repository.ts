import { createClient } from '@/lib/supabase/server';
import { createProduct as createProductService, type ProductInput } from '@/services/product-service';

// Thin compatibility wrappers — all product writes live in the canonical
// Product Service (src/services/product-service.ts). Do not add write logic here.

export async function createProduct(organizationId: string, input: { title: string; price: number; description?: string; image_url?: string; status?: string }) {
  try {
    const data = await createProductService(
      {
        title: input.title,
        price: input.price,
        description: input.description ?? null,
        image_url: input.image_url ?? null,
        status: (input.status as ProductInput['status']) ?? 'active',
      },
      { organizationId },
    );
    return { data, error: null as null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Product creation failed') };
  }
}

export async function createProductForCurrentUser(input: { title: string; price: number; description?: string; image_url?: string; status?: string }) {
  return createProductService({
    title: input.title,
    price: input.price,
    description: input.description ?? null,
    image_url: input.image_url ?? null,
    status: (input.status as ProductInput['status']) ?? 'active',
  });
}

export async function getPublishedProductsByHandle(handle: string) {
  const supabase = createClient();
  const storefront = await supabase.from('storefronts').select('organization_id,is_active').eq('handle', handle).maybeSingle();
  if (storefront.error) throw storefront.error;
  if (!storefront.data?.is_active) return [];

  const products = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', storefront.data.organization_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (products.error) throw products.error;
  return products.data;
}
