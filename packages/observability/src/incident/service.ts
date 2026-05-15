export class IncidentService { open(incidentKey: string){ return { incidentKey, status: "open" as const } } }
