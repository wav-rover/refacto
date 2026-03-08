import type { EventBus } from '../ports/eventBus';

export interface PublishedEvent {
  type: string;
  payload: Record<string, unknown>;
}

export type InMemoryEventBus = EventBus & {
  getPublishedEvents(): PublishedEvent[];
  clear(): void;
};

export function createInMemoryEventBus(): InMemoryEventBus {
  const published: PublishedEvent[] = [];

  return {
    async publish(eventType: string, payload: Record<string, unknown>): Promise<void> {
      published.push({ type: eventType, payload: { ...payload } });
    },
    getPublishedEvents(): PublishedEvent[] {
      return [...published];
    },
    clear(): void {
      published.length = 0;
    },
  };
}
