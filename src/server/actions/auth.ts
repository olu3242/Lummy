'use server';

import { ensureUserWorkspace } from '@/lib/auth/bootstrap';

export async function bootstrapCurrentUser(input?: { fullName?: string; handle?: string }) {
  return ensureUserWorkspace(input);
}
