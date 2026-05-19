import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) throw new Error('Missing NEXT_PUBLIC_APP_URL')
  return NextResponse.redirect(new URL("/login", appUrl))
}
