import { getAIOperationsSnapshot, listAppPrompts } from '@/lib/ai/runtime';

export default async function AIOperationsPage() {
  const snapshot = await getAIOperationsSnapshot();
  const prompts = listAppPrompts();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-cyan-300">AI operations</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Runtime intelligence health</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Executions" value={snapshot.totalExecutions} />
          <Metric label="Provider failures" value={snapshot.providerFailures} />
          <Metric label="Avg latency" value={`${snapshot.averageLatencyMs}ms`} />
          <Metric label="Cost estimate" value={`$${snapshot.estimatedCostUsd}`} />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-lg font-semibold">Provider Health</h2>
            <div className="mt-3 overflow-hidden rounded border border-slate-800">
              {Object.entries(snapshot.providerHealth).map(([provider, count]) => (
                <div key={provider} className="flex items-center justify-between border-b border-slate-800 px-4 py-3 last:border-b-0">
                  <span className="capitalize text-slate-300">{provider}</span>
                  <span className="font-mono text-cyan-200">{count}</span>
                </div>
              ))}
              {Object.keys(snapshot.providerHealth).length === 0 ? (
                <div className="px-4 py-3 text-slate-400">No AI executions recorded yet.</div>
              ) : null}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Prompt Governance</h2>
            <div className="mt-3 space-y-2">
              {prompts.map((prompt) => (
                <div key={`${prompt.key}:${prompt.version}`} className="rounded border border-slate-800 px-4 py-3">
                  <div className="font-medium text-slate-100">{prompt.key}</div>
                  <div className="text-sm text-slate-400">v{prompt.version} · {prompt.environment} · {prompt.approved ? 'approved' : 'blocked'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900 px-4 py-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
