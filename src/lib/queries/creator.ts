import { createClient } from "@/lib/supabase/server"
import type { CreatorProfileRow } from "@/lib/supabase/types"

export type CreatorPublicProfile = Pick<
  CreatorProfileRow,
  | "id" | "handle" | "business_name" | "bio" | "avatar_url" | "cover_url"
  | "whatsapp_number" | "instagram_handle" | "tiktok_handle" | "twitter_handle"
  | "location" | "total_sales" | "total_revenue" | "store_schema"
>

export async function getCreatorByHandle(handle: string): Promise<CreatorPublicProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(`
      id, handle, business_name, bio, avatar_url, cover_url,
      whatsapp_number, instagram_handle, tiktok_handle, twitter_handle,
      location, total_sales, total_revenue, store_schema
    `)
    .eq("handle", handle)
    .eq("is_published", true)
    .maybeSingle()

  if (error) {
    console.error("[getCreatorByHandle]", error.message)
    return null
  }
  return data
}

export async function getCreatorProfile(userId: string): Promise<CreatorProfileRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("[getCreatorProfile]", error.message)
    return null
  }
  return data
}
