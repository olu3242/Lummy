import type { DatabaseClient } from "@lummy/db-core"
export class ApprovalWorkflowService { constructor(private readonly db: DatabaseClient) {} async request(workflowKey: string, requester: string, status = "pending") { return this.db.insert("approval_workflows", { workflow_key: workflowKey, requester, status, created_at: new Date().toISOString() }) } }
