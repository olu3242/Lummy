import { createClient } from "./server"

export const BUCKETS = {
  creatorAssets: "creator-assets",
  productImages: "product-images",
} as const

export type StorageBucket = (typeof BUCKETS)[keyof typeof BUCKETS]

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File | Blob,
  contentType?: string,
): Promise<{ url: string; error?: never } | { url?: never; error: string }> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: contentType ?? (file instanceof File ? file.type : "application/octet-stream"),
    upsert: true,
  })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl }
}

export async function deleteFile(
  bucket: StorageBucket,
  path: string,
): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) return { error: error.message }
  return {}
}

export function buildCreatorPath(creatorId: string, filename: string): string {
  return `${creatorId}/${filename}`
}

export function buildProductPath(creatorId: string, productId: string, filename: string): string {
  return `${creatorId}/${productId}/${filename}`
}
