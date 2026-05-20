import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserWorkspace } from '@/lib/auth/bootstrap';

const safeRelativePath = (value: string | null, fallback = '/onboarding') => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = safeRelativePath(searchParams.get('next'), type === 'recovery' ? '/reset-password' : '/onboarding');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback]', error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  try {
    await ensureUserWorkspace({ next });
  } catch (bootstrapError) {
    console.error('[auth/callback/bootstrap]', bootstrapError);
    return NextResponse.redirect(`${origin}/onboarding?error=bootstrap`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
