import type { QueueProvider } from "../provider"
export class RedisStreamsQueueProvider implements QueueProvider { async publish(){throw new Error("Not configured")}; async consume(){return null}; async ack(){}; async nack(){}; async retry(){}; async deadLetter(){}; async delay(){}; async replay(){}; async heartbeat(){} }
