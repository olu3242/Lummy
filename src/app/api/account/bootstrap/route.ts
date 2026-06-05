import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureCreatorRuntimeContext } from "@/repositories/runtime-bootstrap-repository";

export async function POST() {
  try {
    const supabase = createClient();
    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const context = await ensureCreatorRuntimeContext(supabase, auth.user);
    return NextResponse.json({ ok: true, ...context });
  } catch (error) {
    console.error("[account/bootstrap] failed:", error);
    return NextResponse.json({ error: "Failed to bootstrap account" }, { status: 500 });
  }
}
