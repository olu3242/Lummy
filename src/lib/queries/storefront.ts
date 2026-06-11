import { createClient } from "@/lib/supabase/server"
import type { StoreSchema } from "@/store/schema/types"

export async function loadCreatorStoreSchema(creatorId: string): Promise<StoreSchema | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from("creator_profiles")
      .select("store_schema")
      .eq("id", creatorId)
      .single()

    if (data?.store_schema && typeof data.store_schema === "object") {
      return data.store_schema as unknown as StoreSchema
    }
    return null
  } catch {
    return null
  }
}

export async function saveCreatorStoreSchema(creatorId: string, schema: StoreSchema): Promise<{ error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from("creator_profiles")
      .update({ store_schema: schema as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
      .eq("id", creatorId)

    if (error) return { error: error.message }
    return {}
  } catch (err) {
    console.error("[saveCreatorStoreSchema]", err)
    return { error: "Failed to save store schema" }
  }
}
