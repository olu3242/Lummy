import { NextResponse } from "next/server"
export async function GET(){ return NextResponse.json({ resource: "workflows/executions", status: "ok" }) }
