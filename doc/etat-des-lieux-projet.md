## État des lieux – Projet Todo (refacto)

Ce document synthétise l’état actuel du projet (code + infra) et les principaux axes d’amélioration.

### 1. Architecture & services

- **Architecture actuelle**
  - Front + API Gateway + 4 services : `auth-service`, `project-service`, `task-service`, `notification-service`.
  - Communication inter‑services via **événements** (Redis Streams ou InMemory), pas d’appels HTTP directs.
  - Chaque service a :
    - ses propres ports (`Repository`, `EventBus`) ;
    - ses implémentations SQLite + InMemory ;
    - un README dédié + règles métier centralisées dans `doc/regles-metier/`.
- **Points positifs**
  - Cloisonnement clair entre domaines (auth / projet / tâche / notifications).
  - Contrats d’événements et de routes documentés (`doc/architecture/contrat-evenements.md`, `contrats-routes.md`).
  - Tests unitaires/use cases et tests d’intégration déjà en place sur les services clés.

### 2. Ce qui est réellement implémenté

- **auth-service**
  - Inscription, login, logout, `me` via **session HTTP** (`express-session` + cookie `HttpOnly`).
  - Persistance SQLite (`data/auth-users.db`), hashage bcrypt, modèle user minimal.
- **project-service**
  - Création de projet (owner + membre initial), liste par user, détail, update `name`, gestion des membres, clôture.
  - Publication de l’événement `ProjectClosed`.
- **task-service**
  - CRUD + opérations métier : création, mise à jour, assignation/désassignation, complétion, réouverture, suppression.
  - Règle de capacité **“une seule tâche active par personne”** effectivement appliquée.
  - Publication des événements `TaskCreated`, `TaskAssigned`, `TaskCompleted`, `TaskReopened`, `TaskDeleted`.
- **notification-service**
  - Consommation des événements `TaskAssigned/Completed/Reopened/Deleted`, `ProjectClosed`.
  - Application stricte de la règle **“pas d’auto‑notification”**.
  - `GET /notifications` basé sur `X-User-Id`.

### 3. Manques / divergences par rapport à la vision cible

- **Couplage projet ↔ tâches (règles non encore codées)**
  - Clôture de projet **ne vérifie pas** que toutes les tâches sont terminées.
  - `task-service` **ne consomme pas** `ProjectClosed` :
    - création / réouverture / suppression de tâches possibles même si le projet est fermé (si le client ne filtre pas).
  - `project-service` ne vérifie pas encore avant retrait d’un membre s’il a des tâches assignées dans ce projet.
- **Couplage auth / membres**
  - Aucun contrôle direct que `ownerId` ou `assignedTo` correspond à un user existant (`auth-service`).
  - Ni vérification automatique que l’assigné est **membre du projet** : c’est délégué au client/gateway/tests.
- **Auth côté front/gateway**
  - Mélange “session HTTP” (auth-service/gateway) + “X-User-Id” pour les services métiers :
    - cohérent mais fragile si le gateway ne propage pas correctement l’identité ;
    - pas encore d’unification forte (par ex. middleware unique côté gateway qui traduit `req.user` → `X-User-Id`).
- **Événements “présents dans la vision mais pas implémentés”**
  - Pas d’événements `TaskUpdated`, `MemberAddedToProject` (en dehors du NOOP côté notifications), ni de consommation d’événements projet dans `task-service`.

### 4. Axes d’amélioration prioritaires

- **A. Verrouiller les règles croisées projet/tâche**
  - Dans `task-service` :
    - consommer `ProjectClosed` pour refuser `create/reopen/delete` sur projet fermé (ou exposer un port de read model).
  - Dans `project-service` :
    - avant `removeMember`, interroger un read model/port `TaskReadModel` pour refuser le retrait si tâches actives.
- **B. Durcir la cohérence auth / membres**
  - Introduire, côté gateway, une validation systématique :
    - `X-User-Id` toujours dérivé d’une session valide (`/auth/me`) ;
    - vérifier, pour les calls d’assignation, que `userId` est membre du projet (via `project-service`).
  - Option moyenne échéance : exposer un read model partagé (ex : vue “membres de projet”) consommé par `task-service`.
- **C. Éviter la dérive entre docs et code**
  - Continuer le pattern actuel :
    - docs métier **séparent explicitement** “implémenté maintenant” vs “cible/futur” ;
    - ADR mis à jour en cas de changement significatif (auth, broker, structure des événements).
- **D. Robustesse & observabilité**
  - Ajouter :
    - logs structurés autour des publications/consommations d’événements ;
    - un healthcheck plus riche par service (ex. test rapide de connexion Redis/SQLite).
  - Envisager un mécanisme de **rejeu ou DLQ** pour les événements mal formés côté notification-service.

### 5. Risques / failles potentielles

- **Incohérences métiers silencieuses**
  - Exemples :
    - tâches encore actives sur un projet marqué `closed` (aucun garde‑fou côté `task-service`) ;
    - utilisateur retiré d’un projet alors que des tâches lui sont encore assignées ;
    - assignation de tâches à des `userId` inexistants ou non membres.
- **Évolution des schémas**
  - Les fichiers SQLite sont gérés “à la main” (CREATE TABLE IF NOT EXISTS) :
    - changement de schéma = risque de migration manuelle fragile ;
    - à surveiller si de nouveaux champs ou indexes sont ajoutés.

En résumé : l’architecture et les règles locales par service sont propres et bien testées, mais les **règles transverses** (entre services) reposent encore beaucoup sur le client/gateway et sur l’intention, plutôt que sur des garanties codées (événements consommés, read models, validations centralisées). C’est là que les prochains efforts apporteront le plus de robustesse.