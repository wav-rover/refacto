import Redis from 'ioredis';
import type { EventBus } from '../ports/eventBus';

const DEFAULT_STREAM_NAME = 'todo:events';
const CONSUMER_GROUP = 'notification-service';
const BLOCK_MS = 5000;

interface StreamMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

function parseStreamMessage(data: string): StreamMessage | null {
  try {
    const parsed = JSON.parse(data) as unknown;
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'type' in parsed &&
      typeof (parsed as StreamMessage).type === 'string'
    ) {
      const msg = parsed as StreamMessage;
      return { type: msg.type, payload: msg.payload ?? {}, timestamp: msg.timestamp ?? '' };
    }
  } catch {
    // ignore invalid JSON
  }
  return null;
}

function extractDataFromEntry(fields: unknown[]): string | null {
  if (!Array.isArray(fields)) return null;
  for (let i = 0; i < fields.length - 1; i += 1) {
    if (fields[i] === 'data' && typeof fields[i + 1] === 'string') {
      return fields[i + 1] as string;
    }
  }
  return null;
}

export type RedisEventBus = EventBus & {
  disconnect(): Promise<void>;
};

export function createRedisEventBus(
  redisUrl: string,
  streamName: string = DEFAULT_STREAM_NAME,
): RedisEventBus {
  const redis = new Redis(redisUrl);
  const handlers = new Map<string, Array<(payload: unknown) => Promise<void>>>();

  let running = false;
  let loopDoneResolve: (() => void) | null = null;
  const loopDonePromise = new Promise<void>((resolve) => {
    loopDoneResolve = resolve;
  });

  return {
    subscribe(
      eventType: string,
      handler: (payload: unknown) => Promise<void>,
    ): void {
      const list = handlers.get(eventType) ?? [];
      list.push(handler);
      handlers.set(eventType, list);
    },

    async start(): Promise<void> {
      try {
        await redis.xgroup('CREATE', streamName, CONSUMER_GROUP, '$', 'MKSTREAM');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('BUSYGROUP')) {
          throw err;
        }
      }

      const consumerId = `consumer-${process.pid}`;
      running = true;

      (async () => {
        try {
          while (running) {
            const result = await redis.xreadgroup(
              'GROUP',
              CONSUMER_GROUP,
              consumerId,
              'BLOCK',
              BLOCK_MS,
              'STREAMS',
              streamName,
              '>',
            );

            if (!running) break;
            if (result === null || !Array.isArray(result) || result.length === 0) continue;

            const [, entries] = result[0] as [string, Array<[string, unknown[]]>];
            if (!Array.isArray(entries)) continue;

            for (const [entryId, fields] of entries) {
              if (!running) break;
              const dataStr = extractDataFromEntry(fields);
              if (dataStr === null) continue;

              const message = parseStreamMessage(dataStr);
              if (message === null) continue;

              const list = handlers.get(message.type) ?? [];
              try {
                await Promise.all(list.map((h) => h(message.payload)));
                await redis.xack(streamName, CONSUMER_GROUP, entryId);
              } catch (err: unknown) {
                console.error('[notification-service] Handler error for', message.type, err);
              }
            }
          }
        } finally {
          loopDoneResolve?.();
        }
      })();
    },

    async stop(): Promise<void> {
      running = false;
      await loopDonePromise;
    },

    async disconnect(): Promise<void> {
      await redis.quit();
    },
  };
}
