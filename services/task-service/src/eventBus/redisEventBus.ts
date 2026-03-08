import Redis from 'ioredis';
import type { EventBus } from '../ports/eventBus';

const DEFAULT_STREAM_NAME = 'todo:events';

export type RedisEventBus = EventBus & {
  disconnect(): Promise<void>;
};

export function createRedisEventBus(
  redisUrl: string,
  streamName: string = DEFAULT_STREAM_NAME,
): RedisEventBus {
  const redis = new Redis(redisUrl);

  return {
    async publish(
      eventType: string,
      payload: Record<string, unknown>,
    ): Promise<void> {
      const message = JSON.stringify({
        type: eventType,
        payload,
        timestamp: new Date().toISOString(),
      });
      await redis.xadd(streamName, '*', 'data', message);
    },
    async disconnect(): Promise<void> {
      await redis.quit();
    },
  };
}
