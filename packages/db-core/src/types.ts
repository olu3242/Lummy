export interface QueryResult<T> {
  data: T | null
  error: Error | null
}

export interface DatabaseClient {
  select<T>(table: string, where: Record<string, unknown>): Promise<QueryResult<T[]>>
  findOne<T>(table: string, where: Record<string, unknown>): Promise<QueryResult<T>>
  insert<T>(table: string, payload: T): Promise<QueryResult<T>>
  update<T>(table: string, where: Record<string, unknown>, payload: Partial<T>): Promise<QueryResult<T>>
  upsert<T>(table: string, payload: T): Promise<QueryResult<T>>
}
