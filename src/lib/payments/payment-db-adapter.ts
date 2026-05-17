import type { DatabaseClient, QueryResult } from '@lummy/db-core';

interface SupabaseLikeClient {
  from(table: string): {
    select(columns?: string): {
      match(where: Record<string, unknown>): {
        maybeSingle(): Promise<{ data: unknown; error: Error | null }>;
      };
    };
    insert(payload: unknown): Promise<{ data: unknown; error: Error | null }>;
    update(payload: unknown): {
      match(where: Record<string, unknown>): Promise<{ data: unknown; error: Error | null }>;
    };
    upsert(payload: unknown): Promise<{ data: unknown; error: Error | null }>;
  };
}

export function createPaymentDatabaseAdapter(client: SupabaseLikeClient): DatabaseClient {
  return {
    async select<T>(table: string, where: Record<string, unknown>): Promise<QueryResult<T[]>> {
      const { data, error } = await client.from(table).select('*').match(where).maybeSingle();
      return { data: data ? [data as T] : [], error };
    },
    async findOne<T>(table: string, where: Record<string, unknown>): Promise<QueryResult<T>> {
      const { data, error } = await client.from(table).select('*').match(where).maybeSingle();
      return { data: data as T | null, error };
    },
    async insert<T>(table: string, payload: T): Promise<QueryResult<T>> {
      const { data, error } = await client.from(table).insert(payload);
      return { data: (data || payload) as T, error };
    },
    async update<T>(table: string, where: Record<string, unknown>, payload: Partial<T>): Promise<QueryResult<T>> {
      const { data, error } = await client.from(table).update(payload).match(where);
      return { data: data as T | null, error };
    },
    async upsert<T>(table: string, payload: T): Promise<QueryResult<T>> {
      const { data, error } = await client.from(table).upsert(payload);
      return { data: (data || payload) as T, error };
    },
  };
}
