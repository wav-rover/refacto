/**
 * Port pour la publication d'événements métier (Phase 4).
 * Aligné sur le contrat des événements (doc/architecture/contrat-evenements.md).
 */
export interface EventBus {
  publish(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void>;
}
