export class AlertService { raise(severity: "info"|"warn"|"critical", message: string){ return { severity, message, at: new Date().toISOString() } } }
