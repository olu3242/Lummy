import { NextResponse } from 'next/server'; export async function GET(): Promise<NextResponse> { return NextResponse.json({ resource: 'platform/developers', status: 'ok' }); }
