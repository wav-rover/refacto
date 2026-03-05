# Ports et persistance dans les services

Chaque service possède **son propre domaine** et **ses propres ports** (interfaces). Globalement sauf si besoin On ne réinvente pas la roue : la structure de persistance reprend celle du monolithe, adaptée au domaine du service.

## Principe

- **Port** : interface (ex. `UserRepository`, `ItemRepository`) qui décrit le contrat de persistance (init, teardown, méthodes métier). Elle vit dans un dossier dédié du service (ex. `src/ports/`).
- **Implémentations** : au moins deux par service qui a de la persistance :
  - **SQLite** (ou autre stockage fichier) pour le run local / une instance.
  - **InMemory** pour les tests (pas de DB, pas de fichier).
- **Factory** : un module (ex. `persistence/index.ts`) qui choisit l’implémentation selon l’environnement (ex. `NODE_ENV === "test"` → inMemory, sinon SQLite). Les routes reçoivent le repository par injection (ex. `register(repo)`).

Aucun import inter-service : chaque service ne dépend que de son propre code et de son `node_modules`.

## Référence : auth-service

Le **auth-service** est un **clone du pattern du monolithe** appliqué au domaine utilisateurs :

- `src/ports/userRepository.ts` — interface `UserRepository` (init, teardown, create, findByEmail, findById).
- `src/persistence/sqlite.ts` — implémentation SQLite (table `users`).
- `src/persistence/inMemory.ts` — implémentation en mémoire pour les tests.
- `src/persistence/index.ts` — `createRepository()` : test → inMemory, sinon SQLite ; export du repository par défaut.

Les routes (`register`, `login`) reçoivent le repository en argument et n’importent pas directement sqlite ou inMemory. Les tests utilisent le repository fourni par la factory (en test = inMemory), sans fichier DB.

Pour les **autres services** (project-service, task-service, notification-service), lorsqu’ils auront de la persistance, on applique le même schéma : port dédié au domaine du service, implémentations sqlite + inMemory, factory, injection dans les routes. Chaque service reste autonome et cohérent avec le reste du repo.
