# Règles d'architecture

Ce document décrit les règles d'architecture appliquées par dependency-cruiser.

---

## Règle : pas de DB / infra dans le domaine

### Périmètre

Les modules du **domaine**, c'est-à-dire les modules sous `src/domain`.

### Interdit

Les modules du domaine ne doivent **pas** importer :

- **mysql2**, **sqlite3** : drivers de base de données
- **express** : serveur HTTP
- **wait-port** : utilitaire d'infrastructure (attente de port)
- Ou tout autre module d'infrastructure (DB, HTTP, etc.)

La liste exacte est définie dans `.dependency-cruiser.js` (règle `no-db-or-infra-in-domain`) et peut être étendue si nécessaire (ex. autres drivers DB).

### Objectif

Le domaine doit rester **pur** et ne pas dépendre directement des couches d'infrastructure. Cela permet une meilleure testabilité et une séparation claire des responsabilités.

### Application

- La règle est appliquée par **dependency-cruiser** via le script `npm run lint:deps`.
- En phase 5, aucun refactoring métier n'est réalisé. Si le dossier `src/domain` n'existe pas encore, la règle ne s'applique à aucun fichier et est prête pour la phase 6.

---

## Règle : pas de sqlite3 dans les tests (Phase 6)

### Périmètre

Les fichiers de **tests unitaires**, c'est-à-dire les modules sous `spec/`.

### Interdit

Les tests ne doivent **pas** importer :

- **sqlite3** : driver SQLite (via `node_modules/sqlite3`)
- **src/persistence/sqlite** : implémentation SQLite du repository

### Objectif

En environnement de test (`NODE_ENV=test`), seule l'implémentation **InMemoryRepository** doit être utilisée. Cela garantit :

- Des tests rapides et sans dépendance externe (pas de fichier DB)
- Une isolation complète de l'infrastructure
- La possibilité de mocker facilement le repository

### Application

- La règle `no-sqlite-in-tests` est définie dans `.dependency-cruiser.js`.
- Elle est vérifiée via le script `npm run lint:deps`.
- Toute tentative d'importer `sqlite3` ou `src/persistence/sqlite` depuis un fichier sous `spec/` provoquera une erreur bloquante.

### Exécution en CI

```bash
npm run lint:deps
```

Cette commande doit être exécutée dans la CI pour bloquer toute régression (réintroduction de sqlite3 dans les tests).

---

## Règle : pas d’appels HTTP directs entre services (Phase 2+)

### Périmètre

Les services backend sous `services/` (`project-service`, `task-service`, `notification-service`, `auth-service`).

### Interdit

- Les services ne doivent **pas** faire d’appels HTTP directs les uns vers les autres (ex. `project-service` → `task-service` en HTTP).
- Ils ne doivent pas non plus importer de code d’un autre service (`import ... from '../../task-service'`, etc.).

### Objectif

La communication inter-services se fait via le **message broker** (Redis en phase 2) et des événements métier publiés/consommés. Les services restent découplés ; un gateway / edge pourra plus tard exposer une API unifiée vers l’extérieur.

### Application

- Documentée dans `services/ports-et-persistence.md`.
- Vérifiée progressivement via dependency-cruiser : des règles `no-inter-service-import` interdisent à chaque service d’importer du code d’un autre service (`services/<nom-service>/`).
