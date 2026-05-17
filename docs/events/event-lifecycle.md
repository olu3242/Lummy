# Event Lifecycle

1. Validate payload via zod registry schema.
2. Build tenant-aware envelope.
3. Emit serialized envelope.
4. Consumer validates schema version.
5. Retry safely using idempotency key.
