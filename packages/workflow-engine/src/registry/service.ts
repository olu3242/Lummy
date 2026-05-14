export class WorkflowRegistryService { private ids = new Set<string>(); register(id: string){ this.ids.add(id) } has(id: string){ return this.ids.has(id) } }
