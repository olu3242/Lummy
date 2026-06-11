import type { ConnectionOptions } from "bullmq"
import IORedis from "ioredis"

let _redis: IORedis | null = null

export function getRedisConnection(): ConnectionOptions {
  if (!_redis) {
    const url = process.env.REDIS_URL
    _redis = url
      ? new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: false })
      : new IORedis({
          host:                process.env.REDIS_HOST ?? "localhost",
          port:                Number(process.env.REDIS_PORT ?? 6379),
          password:            process.env.REDIS_PASSWORD,
          maxRetriesPerRequest: null,
          enableReadyCheck:    false,
        })

    _redis.on("error", (err: Error) => {
      // Log but don't crash — callers should handle gracefully
      console.error("[redis] connection error", err.message)
    })
  }
  return _redis as unknown as ConnectionOptions
}

/** Dedicated connection for BullMQ workers (must not share with subscribers) */
export function createWorkerConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL
  const connection = url
    ? new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: false })
    : new IORedis({
        host:                process.env.REDIS_HOST ?? "localhost",
        port:                Number(process.env.REDIS_PORT ?? 6379),
        password:            process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        enableReadyCheck:    false,
      })

  return connection as unknown as ConnectionOptions
}
