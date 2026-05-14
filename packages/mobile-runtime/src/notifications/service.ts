import type { DatabaseClient } from "@lummy/db-core"
export class PushNotificationService { constructor(private readonly db: DatabaseClient) {} async log(token: string, title: string) { return this.db.insert("push_notification_logs", { token, title, sent_at: new Date().toISOString() }) } }
