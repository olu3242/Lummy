import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const requiredPaths = [
  'packages/payments-core/src/provider-router.ts',
  'packages/payments-core/src/stripe-provider.ts',
  'packages/payments-core/src/paystack-provider.ts',
  'packages/automation-runtime/src/workflow-executor.ts',
  'packages/ai-runtime/src/model-executor.ts',
  'packages/events-core/src/retry.ts',
  'supabase/migrations/037_ai_runtime_operationalization.sql',
  'supabase/migrations/038_durable_commerce_orchestration.sql',
  'supabase/migrations/039_final_operational_hardening.sql',
  'docs/launch/alpha-readiness-framework.md',
];

const requiredText = [
  ['packages/payments-core/src/provider-types.ts', 'refundPayment(providerReference'],
  ['packages/payments-core/src/provider-router.ts', 'assertProviderCapabilities'],
  ['packages/automation-runtime/src/workflow-executor.ts', 'automation.retry'],
  ['packages/automation-runtime/src/dead-letter-handler.ts', 'automation.dlq'],
  ['packages/ai-runtime/src/factory.ts', 'new OpenAIProvider()'],
  ['packages/ai-runtime/src/factory.ts', 'new AnthropicProvider()'],
  ['src/app/api/runtime/launch-readiness/route.ts', 'aiTelemetryTableCheck'],
  ['src/app/api/runtime/launch-readiness/route.ts', 'commerceEventTableCheck'],
];

const failures = [];

for (const path of requiredPaths) {
  if (!existsSync(join(root, path))) failures.push(`missing ${path}`);
}

for (const [path, text] of requiredText) {
  const full = join(root, path);
  if (!existsSync(full)) {
    failures.push(`missing ${path}`);
    continue;
  }
  if (!readFileSync(full, 'utf8').includes(text)) failures.push(`${path} does not include ${text}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: requiredPaths.length + requiredText.length }, null, 2));
