import Link from "next/link"
import { Eye, Mail, Send, Split } from "lucide-react"
import { sendCommunication } from "@/lib/communications/communication-service"
import { listTemplates, renderTemplate } from "@/lib/communications/template-registry"
import type { TemplateVariables } from "@/lib/communications/render-template"

const sampleVariables: TemplateVariables = {
  practice_name: "Zenith Dental Group",
  contact_name: "Avery",
  patient_name: "Jordan Lee",
  provider_name: "Dr. Morgan",
  appointment_date: "June 18, 2026",
  appointment_time: "10:30 AM",
  meeting_link: "https://example.com/meeting",
  report_link: "https://example.com/report",
  revenue_recovery_estimate: "$42,800",
  practice_health_score: "87",
  review_link: "https://example.com/review",
  portal_link: "https://example.com/mission-control",
}

async function testSend(formData: FormData) {
  "use server"
  const templateId = String(formData.get("templateId") ?? "")
  const recipient = String(formData.get("recipient") ?? "")
  if (!templateId || !recipient) throw new Error("templateId and recipient are required")

  await sendCommunication({
    event: templateId,
    recipient,
    templateId,
    organizationId: null,
    correlationId: `template_preview_${Date.now()}`,
    variables: sampleVariables,
  })
}

export default function CommunicationTemplatesPage({
  searchParams,
}: {
  searchParams?: { template?: string; variant?: "a" | "b" }
}) {
  const templates = listTemplates()
  const selected = templates.find((template) => template.id === searchParams?.template) ?? templates[0]
  const rendered = renderTemplate(selected.id, sampleVariables, { variant: searchParams?.variant })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Template Preview Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Preview, validate variables, inspect A/B subjects, and send controlled tests.</p>
        </div>
        <Link href="/admin/communications" className="inline-flex items-center gap-2 border border-border px-3 py-2 text-sm font-medium">
          <Mail className="h-4 w-4" />
          Deliveries
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="border border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-semibold">Templates</h2>
          </div>
          <div className="max-h-[720px] overflow-y-auto">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/admin/communications/templates?template=${template.id}`}
                className={`block border-b border-border px-4 py-3 text-sm ${template.id === selected.id ? "bg-muted" : "hover:bg-muted/50"}`}
              >
                <span className="block font-medium">{template.name}</span>
                <span className="mt-1 block font-mono text-xs text-muted-foreground">{template.id}</span>
              </Link>
            ))}
          </div>
        </aside>

        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-border p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Subject</p>
              <p className="mt-2 font-medium">{rendered.subject}</p>
              <p className="mt-2 text-sm text-muted-foreground">{rendered.previewText}</p>
            </div>
            <div className="border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Validation</p>
              <p className="mt-2 text-sm font-medium">{rendered.valid ? "PASS" : "FAIL"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{rendered.missingVariables.length ? rendered.missingVariables.join(", ") : "All required variables resolved."}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-border">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Split className="h-4 w-4" />
                <h2 className="font-semibold">Variables</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Sample</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.variables.map((name) => (
                      <tr key={name} className="border-t border-border">
                        <td className="px-4 py-2 font-mono text-xs">{name}</td>
                        <td className="px-4 py-2">{String(sampleVariables[name] ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Send className="h-4 w-4" />
                <h2 className="font-semibold">Test Send</h2>
              </div>
              <form action={testSend} className="space-y-3">
                <input type="hidden" name="templateId" value={selected.id} />
                <label className="block text-sm font-medium" htmlFor="recipient">Recipient</label>
                <input
                  id="recipient"
                  name="recipient"
                  type="email"
                  required
                  className="w-full border border-border bg-background px-3 py-2 text-sm"
                  placeholder="ops@example.com"
                />
                <button className="inline-flex items-center gap-2 border border-border px-3 py-2 text-sm font-medium" type="submit">
                  <Send className="h-4 w-4" />
                  Send test
                </button>
              </form>
            </div>
          </div>

          <div className="border border-border">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Eye className="h-4 w-4" />
              <h2 className="font-semibold">Rendered Preview</h2>
            </div>
            <iframe title={`${selected.name} preview`} className="h-[620px] w-full bg-white" srcDoc={rendered.html} />
          </div>
        </section>
      </div>
    </div>
  )
}
