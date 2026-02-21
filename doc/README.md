# Documentation du projet Todo (refacto)

Index de la documentation technique et du plan de refonte.

---

## Plan global

- **[Plan de refonte complet](./plan-refonte-complet.md)** — Vue d’ensemble et état d’avancement

---

## Phases (étapes de refactorisation)

| Fichier | Description |
|---------|-------------|
| [phase-1-repartition-taches.md](./phases/phase-1-repartition-taches.md) | Répartition des tâches (tests) |
| [phase-2-installation-et-verification.md](./phases/phase-2-installation-et-verification.md) | Installation et vérification |
| [phase-3-introduction-typescript.md](./phases/phase-3-introduction-typescript.md) | Introduction TypeScript |
| [phase-4-documentation.md](./phases/phase-4-documentation.md) | Documentation |
| [phase-4-mise-a-jour-node.md](./phases/phase-4-mise-a-jour-node.md) | Mise à jour Node |
| [phase-5-hygiene-projet.md](./phases/phase-5-hygiene-projet.md) | Hygiène du projet |
| [phase-6-isolation-infrastructure.md](./phases/phase-6-isolation-infrastructure.md) | Isolation infrastructure |
| [phase-7-statut-priorite-date-auth.md](./phases/phase-7-statut-priorite-date-auth.md) | Statut, priorité, date, auth |

---

## Architecture & décisions

- **[ADR](./adr/)** — Architecture Decision Records  
  - [ADR 001 – Stratégie de refactorisation](./adr/adr-001-strategie-refactorisation-todo.md)

---

## Référence technique

- **[architecture/](./architecture/)**  
  - [Règles d’architecture](./architecture/regles-architecture.md) — Règles dependency-cruiser, domaine vs infra  
  - [Contrats des routes API](./architecture/contrats-routes.md) — Comportement des routes (figé par les tests)  
  - [Cartographie des flux](./architecture/cartographie-flux-app.md) — Flux front-end (`app.js`)
