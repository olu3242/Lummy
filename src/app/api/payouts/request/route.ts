import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse(401, 'UNAUTHORIZED', 'Authentication required', correlationId);

  const body = await req.json() as {
    amount?: number;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    notes?: string;
  };

  if (!body.amount || body.amount <= 0) {
    return errorResponse(400, 'INVALID_AMOUNT', 'Amount must be greater than zero', correlationId);
  }
  if (!body.bankName || !body.accountNumber || !body.accountName) {
    return errorResponse(400, 'MISSING_BANK_DETAILS', 'Bank name, account number, and account name are required', correlationId);
  }

  const profile = await supabase.from('profiles').select('organization_id').eq('id', user.id).maybeSingle();
  if (profile.error || !profile.data?.organization_id) {
    return errorResponse(400, 'NO_ORGANIZATION', 'No organization found for this user', correlationId);
  }
  const orgId = profile.data.organization_id;

  // Upsert payout account
  const accountUpsert = await supabase.from('payout_accounts').upsert(
    {
      organization_id: orgId,
      user_id: user.id,
      bank_name: body.bankName,
      account_number: body.accountNumber,
      account_name: body.accountName,
      is_default: true,
    },
    { onConflict: 'organization_id,account_number,bank_name' },
  ).select('id').single();

  if (accountUpsert.error) {
    logApiEvent('error', 'payouts.account_upsert_failed', { correlationId, message: accountUpsert.error.message });
    return errorResponse(500, 'ACCOUNT_SAVE_FAILED', 'Failed to save bank account', correlationId);
  }

  const withdrawal = await supabase.from('withdrawal_requests').insert({
    organization_id: orgId,
    user_id: user.id,
    payout_account_id: accountUpsert.data.id,
    amount: body.amount,
    currency: 'NGN',
    status: 'pending',
    notes: body.notes ?? null,
  }).select('id,amount,status,created_at').single();

  if (withdrawal.error) {
    logApiEvent('error', 'payouts.withdrawal_request_failed', { correlationId, message: withdrawal.error.message });
    return errorResponse(500, 'WITHDRAWAL_FAILED', 'Failed to create withdrawal request', correlationId);
  }

  logApiEvent('info', 'payouts.withdrawal_requested', { correlationId, withdrawalId: withdrawal.data.id, amount: body.amount });
  return NextResponse.json({ withdrawal: withdrawal.data, correlationId }, { headers: { 'x-correlation-id': correlationId } });
}
