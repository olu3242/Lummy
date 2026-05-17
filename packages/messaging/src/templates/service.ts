import { PersonalizationService } from "../personalization/service"

export interface MessageTemplate { id: string; provider: "whatsapp" | "email" | "sms"; body: string }
export class TemplateService {
  constructor(private readonly personalization = new PersonalizationService()) {}
  render(template: MessageTemplate, variables: Record<string, string> = {}) { return this.personalization.render(template.body, variables) }
}
