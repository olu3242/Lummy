import { createClient } from '@/lib/supabase/server';

export async function createProduct(organizationId: string, input: { title: string; price: number; description?: string }) {
  const supabase = await createClient();
  return supabase.from('products').insert({ organization_id: organizationId, title: input.title, price: input.price, description: input.description ?? null }).select('*').single();
}
