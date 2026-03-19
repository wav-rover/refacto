# Ports et persistance dans les services

Chaque service possède **son propre domaine** et **ses propres ports** (interfaces). On ne réinvente pas la roue : la structure de persistance reprend celle du monolithe, adaptée au domaine du service.

## Stockage : `data/` à la racine du repo

On bascule **service par service** le stockage des bases SQLite (et autres fichiers de persistance) vers le dossier **`data/`** à la racine du repo, au lieu de chemins type `/etc/...`.

Objectifs :
- meilleure **visibilité** (tout au même endroit) ;
- **compatibilité** (pas de droits root, même en dev et en Docker) ;
- **simplicité** (un seul endroit à documenter, à ignorer dans `.gitignore`, ou à monter en volume).

En Docker, la convention est de monter un volume sur **`/app/data`** et de pointer la variable `*_SQLITE_DB_LOCATION` vers un chemin **dans `/app/data`**.

## Principe

- **Port** : interface (ex. `UserRepository`, `ItemRepository`) qui décrit le contrat de persistance (init, teardown, méthodes métier). Elle vit dans un dossier dédié du service (ex. `src/ports/`).
- **Implémentations** : au moins deux par service qui a de la persistance :
  - **SQLite** (ou autre stockage fichier) pour le run local / une instance.
  - **InMemory** pour les tests (pas de DB, pas de fichier).
- **Factory** : un module (ex. `persistence/index.ts`) qui choisit l’implémentation selon l’environnement (ex. `NODE_ENV === "test"` → inMemory, sinon SQLite). Les routes reçoivent le repository par injection (ex. `register(repo)`).

## Communication inter-services

- Aucun import inter-service : chaque service ne dépend que de son propre code et de son `node_modules`.
- Pas d’appels HTTP directs entre services (project, task, notification, auth) : la communication métier se fera **via le broker de messages** (Redis en phase 2), sur la base d’événements publiés/consommés. Les services restent ainsi découplés ; un éventuel gateway/API edge sera responsable d’orchestrer les appels HTTP externes.

## Référence : auth-service

Le **auth-service** est un **clone du pattern du monolithe** appliqué au domaine utilisateurs :

- `src/ports/userRepository.ts` — interface `UserRepository` (init, teardown, create, findByEmail, findById).
- `src/persistence/sqlite.ts` — implémentation SQLite (table `users`).
- `src/persistence/inMemory.ts` — implémentation en mémoire pour les tests.
- `src/persistence/index.ts` — `createRepository()` : test → inMemory, sinon SQLite ; export du repository par défaut.

Les routes (`register`, `login`) reçoivent le repository en argument et n’importent pas directement sqlite ou inMemory. Les tests utilisent le repository fourni par la factory (en test = inMemory), sans fichier DB.

Pour les **autres services** (project-service, task-service, notification-service), lorsqu’ils auront de la persistance, on applique le même schéma : port dédié au domaine du service, implémentations sqlite + inMemory, factory, injection dans les routes. Chaque service reste autonome et cohérent avec le reste du repo.
