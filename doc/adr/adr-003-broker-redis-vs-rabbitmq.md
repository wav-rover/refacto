# ADR 003 – Choix du broker de messages (Redis vs RabbitMQ)

- **Statut** : Proposé
- **Date** : 2026-03
- **Contexte** : Event-driven microservices ; besoin d’un message broker pour découpler les services.

## Comparaison

| Critère | Redis (Streams ou Pub/Sub) | RabbitMQ |
|--------|----------------------------|----------|
| **Complexité** | Plus simple : un serveur, peu de concepts. | Plus riche : exchanges, queues, bindings, à apprendre et opérer. |
| **Persistance** | Pub/Sub : non (message perdu si consumer absent). Streams : oui. | Oui, messages sur disque, files durables. |
| **Garanties** | Streams : at-least-once, consumer groups. Pub/Sub : best-effort. | At-least-once, acks, dead-letter, retry. |
| **Routing** | Limité (streams / channels). | Avancé : topic, direct, fanout, filtres. |
| **Opération** | Léger, souvent déjà présent (cache, sessions). | Service dédié, plus de config. |

## Synthèse

- **Redis** : bon pour démarrer vite, volume modéré. Utiliser **Streams** (pas seulement Pub/Sub) pour ne pas perdre d’événements.
- **RabbitMQ** : adapté si on veut dès le départ des files solides, du routing fin et des garanties de livraison.

## Décision (à valider)

Pour la phase 2 (broker + 4 services), **Redis Streams** est retenu en premier : simplicité, un seul composant, suffisant pour publier des événements (task.created, project.updated, etc.) et faire consommer le notification-service. Migration vers RabbitMQ possible plus tard si besoin de routing avancé ou de garanties renforcées.
