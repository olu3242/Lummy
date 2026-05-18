import { NextResponse } from "next/server"
export async function GET(){ return NextResponse.json({ resource: "workflows/replay", status: "ok" }) }
