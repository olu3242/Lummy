import { createClient } from "@/lib/supabase/server"
import type { ProductRow } from "@/lib/supabase/types"

export type PublicProduct = Pick<
  ProductRow,
  | "id" | "name" | "description" | "price" | "compare_at_price"
  | "images" | "category" | "is_featured" | "stock_quantity"
  | "is_unlimited_stock" | "total_sales" | "whatsapp_enabled"
>

export async function getPublicProducts(creatorId: string): Promise<PublicProduct[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, description, price, compare_at_price,
      images, category, is_featured, stock_quantity,
      is_unlimited_stock, total_sales, whatsapp_enabled
    `)
    .eq("creator_id", creatorId)
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("total_sales", { ascending: false })

  if (error) {
    console.error("[getPublicProducts]", error.message)
    return []
  }
  return data ?? []
}

export async function getCreatorProducts(creatorId: string): Promise<ProductRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getCreatorProducts]", error.message)
    return []
  }
  return data ?? []
}
