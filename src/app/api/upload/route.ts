import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadFile, BUCKETS, buildCreatorPath, buildProductPath, type StorageBucket } from "@/lib/supabase/storage"
import { checkRateLimit, getRateLimitKey, rateLimitHeaders } from "@/lib/security/rate-limit"
import { sanitizeFilename } from "@/lib/security/idempotency"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membership.error) return NextResponse.json({ error: membership.error.message }, { status: 500 })

  const { data: legacyProfile } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  const ownerPath = membership.data?.organization_id ?? legacyProfile?.id ?? user.id

  // 30 uploads per minute per creator
  const rl = checkRateLimit(getRateLimitKey("upload", request, ownerPath), 30)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Upload rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: "Invalid multipart data" }, { status: 400 })

  const file = formData.get("file")
  const type = formData.get("type") as string | null   // 'avatar' | 'banner' | 'product'
  const productId = formData.get("productId") as string | null

  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 })
  }

  const safeName = sanitizeFilename(file.name)
  const ext = safeName.split(".").pop() ?? "jpg"
  const timestamp = Date.now()
  let bucket: StorageBucket
  let path: string

  if (type === "product" && productId) {
    bucket = BUCKETS.productImages
    path = buildProductPath(ownerPath, productId, `${timestamp}.${ext}`)
  } else {
    bucket = BUCKETS.creatorAssets
    path = buildCreatorPath(ownerPath, `${type ?? "upload"}-${timestamp}.${ext}`)
  }

  const result = await uploadFile(bucket, path, file)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ url: result.url, path, bucket })
}
