import type { EventBus } from "../ports/eventBus";

const EVENT_TYPES = [
  "TaskAssigned",
  "TaskCompleted",
  "TaskReopened",
  "TaskDeleted",
  "ProjectClosed",
  "MemberAddedToProject",
] as const;

/**
 * Enregistre les handlers par type d'événement sur l'EventBus.
 * Phase 3 : handlers vides. Phase 4 : appeler createNotificationIfAllowed + repo.
 */
export function registerHandlers(eventBus: EventBus): void {
  for (const eventType of EVENT_TYPES) {
    eventBus.subscribe(eventType, async () => {});
  }
}
