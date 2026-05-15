export class AIValidationService { validateOutput(output: string) { if (!output?.trim()) throw new Error("empty model output") } }
