export interface MessageTemplate {
  id: string
  provider: "whatsapp" | "email" | "sms"
  body: string
}

export class TemplateService {
  render(template: MessageTemplate, variables: Record<string, string> = {}) {
    return Object.entries(variables).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, "g"), value),
      template.body
    )
  }
}
