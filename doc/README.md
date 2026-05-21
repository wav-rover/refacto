# Documentation du projet Todo (refacto)

Index de la documentation technique et du plan de refonte.

---

## Architecture & décisions

- **[ADR](./adr/)** — Architecture Decision Records  
  - [ADR 001 – Stratégie de refactorisation](./adr/adr-001-strategie-refactorisation-todo.md)
  - [ADR 002 – API Gateway vs BFF](./adr/adr-002-api-gateway-vs-bff.md)
  - [ADR 003 – Broker Redis vs RabbitMQ](./adr/adr-003-broker-redis-vs-rabbitmq.md)
  - [ADR 004 – Stratégie d'intégration continue (CI)](./adr/adr-004-strategie-integration-continue.md)
  - [ADR 005 – Livraison des images Docker et registry (CD)](./adr/adr-005-livraison-docker-registry.md)

---

## Référence technique

- **[architecture/](./architecture/)**  
  - [Règles d’architecture](./architecture/regles-architecture.md) — Règles dependency-cruiser, domaine vs infra  
  - [Contrats des routes API](./architecture/contrats-routes.md) — Comportement des routes (figé par les tests)  
  - [Contrat des événements](./architecture/contrat-evenements.md) — Format des messages (broker), payloads
  - [Cartographie des flux](./architecture/cartographie-flux-app.md) — Flux front-end (`app.js`)

---

## Règles métier (par service)

- [Auth service](./regles-metier/regles-metier-auth-service.md)
- [Project service](./regles-metier/regles-metier-project-service.md)
- [Task service](./regles-metier/regles-metier-task-service.md)
- [Notification service](./regles-metier/regles-metier-notification-service.md)

---

## Services (mono-repo)

- Voir `services/README.md` pour l’arborescence, l’isolation et les commandes par service.
