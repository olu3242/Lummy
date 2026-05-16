import { NextResponse } from "next/server"
export async function GET(){ return NextResponse.json({ resource: "queues", status: "ok" }) }
