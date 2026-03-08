import type { EventBus } from '../ports/eventBus';

export type InMemoryEventBus = EventBus & {
  emit(eventType: string, payload: unknown): Promise<void>;
};

function createInMemoryEventBus(): InMemoryEventBus {
  const handlers = new Map<string, Array<(payload: unknown) => Promise<void>>>();

  const eventBus: InMemoryEventBus = {
    subscribe(
      eventType: string,
      handler: (payload: unknown) => Promise<void>,
    ): void {
      const list = handlers.get(eventType) ?? [];
      list.push(handler);
      handlers.set(eventType, list);
    },

    start(): Promise<void> {
      return Promise.resolve();
    },

    stop(): Promise<void> {
      return Promise.resolve();
    },

    async emit(eventType: string, payload: unknown): Promise<void> {
      const list = handlers.get(eventType) ?? [];
      await Promise.all(list.map((h) => h(payload)));
    },
  };

  return eventBus;
}

export { createInMemoryEventBus };
