/**
 * Port pour la consommation d'événements métier.
 * En phase 3 : sans redis, juste en préparation pour la phase 4.
 * En phase 4 : implémentation Redis qui souscrit au broker.
 */
export interface EventBus {
  subscribe(
    eventType: string,
    handler: (payload: unknown) => Promise<void>,
  ): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}
