import type { DatabaseClient } from "@lummy/db-core"
export class OrgApprovalService { constructor(private readonly db: DatabaseClient) {} async request(orgId: string, requestType: string, requester: string) { return this.db.insert("approval_requests", { organization_id: orgId, request_type: requestType, requester, status: "pending", created_at: new Date().toISOString() }) } }
