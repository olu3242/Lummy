export class PersonalizationService {
  render(content: string, attributes: Record<string, string>) {
    return Object.entries(attributes).reduce((acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, "g"), v), content)
  }
}
