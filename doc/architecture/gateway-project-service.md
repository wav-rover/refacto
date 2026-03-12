## Contrat API Gateway ↔ project-service

Ce document décrit le contrat **HTTP public du Gateway** pour les projets et membres, ainsi que le **mapping exact** vers `project-service`.

- **Périmètre** : opérations projets/membres uniquement.
- **Hors périmètre** : tâches (`task-service`), notifications (`notification-service`), auth-service (couvert par Jeremy).

Les routes publiques du Gateway sont toutes préfixées par `/api`.

---

## 1. Endpoints publics du Gateway (projets & membres)

### 1.1. GET /api/projects

**Description** : liste les projets visibles (actuellement tous les projets, comme `GET /projects`).

- **Méthode** : `GET`
- **URL** : `/api/projects`
- **Auth** : aucune exigence spécifique (comportement aligné sur `GET /projects` actuel)
- **Headers requis** :
  - `X-Request-Id` (optionnel mais recommandé, posé par le client ou un middleware global)

**Request**

- `path params` : aucun
- `query params` : aucun
- `body` : aucun

**Response – 200**

```json
[
  {
    "id": "uuid-projet",
    "name": "Projet A",
    "ownerId": "uuid-owner",
    "memberIds": ["uuid-owner", "uuid-membre-2"],
    "status": "open",
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
]
```

**Erreurs**

En cas d’erreur réseau/interne entre Gateway et `project-service` :

- `502` – `{ "error": "UPSTREAM_UNAVAILABLE", "message": "project-service unavailable" }`

---

### 1.2. POST /api/projects

**Description** : crée un projet ; l’appelant devient chef de projet et membre.

- **Méthode** : `POST`
- **URL** : `/api/projects`
- **Auth** : utilisateur connecté obligatoire
- **Headers requis** :
  - `Authorization` / cookie (géré par l’auth du Gateway)
  - `X-Request-Id` (optionnel mais recommandé)

**Request**

- `path params` : aucun
- `query params` : aucun
- `body` JSON :

```json
{
  "name": "Mon projet"
}
```

Contraintes :

- `name` : string non vide après trim.

**Response – 201**

```json
{
  "id": "uuid-projet",
  "name": "Mon projet",
  "ownerId": "uuid-owner",
  "memberIds": ["uuid-owner"],
  "status": "open",
  "createdAt": "2025-01-01T10:00:00.000Z"
}
```

**Erreurs**

- `400` – `{ "error": "INVALID_INPUT", "message": "Name is required" }`
- `401` – `{ "error": "UNAUTHENTICATED", "message": "User must be authenticated" }`
- `502` – `{ "error": "UPSTREAM_UNAVAILABLE", "message": "project-service unavailable" }`

---

### 1.3. PATCH /api/projects/:projectId

**Description** : met à jour les métadonnées du projet (nom). Réservé au chef de projet. Interdit si projet clôturé.

- **Méthode** : `PATCH`
- **URL** : `/api/projects/:projectId`
- **Auth** : utilisateur connecté obligatoire
- **Headers requis** :
  - `Authorization` / cookie
  - `X-Request-Id`

**Request**

- `path params` :
  - `projectId` : identifiant du projet (UUID string)
- `query params` : aucun
- `body` JSON :

```json
{
  "name": "Nouveau nom"
}
```

Contraintes :

- `name` : optionnel, mais si présent, non vide après trim.

**Response – 200**

```json
{
  "id": "uuid-projet",
  "name": "Nouveau nom",
  "ownerId": "uuid-owner",
  "memberIds": ["uuid-owner", "uuid-membre-2"],
  "status": "open",
  "createdAt": "2025-01-01T10:00:00.000Z"
}
```

**Erreurs**

- `400` – `{ "error": "INVALID_INPUT", "message": "Invalid project data" }`
- `401` – `{ "error": "UNAUTHENTICATED", "message": "User must be authenticated" }`
- `403` – `{ "error": "FORBIDDEN", "message": "Only owner can update project" }`
- `404` – `{ "error": "NOT_FOUND", "message": "Project not found" }`
- `409` – `{ "error": "CONFLICT", "message": "Project is closed" }`
- `502` – `{ "error": "UPSTREAM_UNAVAILABLE", "message": "project-service unavailable" }`

---

### 1.4. POST /api/projects/:projectId/close

**Description** : clôture un projet. Réservé au chef de projet.

- **Méthode** : `POST`
- **URL** : `/api/projects/:projectId/close`
- **Auth** : utilisateur connecté obligatoire
- **Headers requis** :
  - `Authorization` / cookie
  - `X-Request-Id`

**Request**

- `path params` :
  - `projectId` : identifiant du projet
- `query params` : aucun
- `body` : vide

**Response – 200**

```json
{
  "id": "uuid-projet",
  "name": "Mon projet",
  "ownerId": "uuid-owner",
  "memberIds": ["uuid-owner", "uuid-membre-2"],
  "status": "closed",
  "createdAt": "2025-01-01T10:00:00.000Z"
}
```

**Erreurs**

- `401` – `{ "error": "UNAUTHENTICATED", "message": "User must be authenticated" }`
- `403` – `{ "error": "FORBIDDEN", "message": "Only owner can close project" }`
- `404` – `{ "error": "NOT_FOUND", "message": "Project not found" }`
- `409` – `{ "error": "CONFLICT", "message": "Project already closed or tasks not completed" }`
- `502` – `{ "error": "UPSTREAM_UNAVAILABLE", "message": "project-service unavailable" }`

---

### 1.5. POST /api/projects/:projectId/members

**Description** : ajoute un membre au projet. Réservé au chef de projet.

- **Méthode** : `POST`
- **URL** : `/api/projects/:projectId/members`
- **Auth** : utilisateur connecté obligatoire
- **Headers requis** :
  - `Authorization` / cookie
  - `X-Request-Id`

**Request**

- `path params` :
  - `projectId` : identifiant du projet
- `body` JSON :

```json
{
  "userId": "uuid-membre"
}
```

Contraintes :

- `userId` : string non vide après trim.

**Response – 200**

```json
{
  "id": "uuid-projet",
  "name": "Mon projet",
  "ownerId": "uuid-owner",
  "memberIds": ["uuid-owner", "uuid-membre"],
  "status": "open",
  "createdAt": "2025-01-01T10:00:00.000Z"
}
```

**Erreurs**

- `400` – `{ "error": "INVALID_INPUT", "message": "userId is required" }`
- `401` – `{ "error": "UNAUTHENTICATED", "message": "User must be authenticated" }`
- `403` – `{ "error": "FORBIDDEN", "message": "Only owner can add members" }`
- `404` – `{ "error": "NOT_FOUND", "message": "Project not found" }`
- `409` – `{ "error": "CONFLICT", "message": "User already member" }`
- `502` – `{ "error": "UPSTREAM_UNAVAILABLE", "message": "project-service unavailable" }`

---

### 1.6. DELETE /api/projects/:projectId/members/:userId

**Description** : retire un membre du projet. Réservé au chef de projet. Le chef ne peut pas être retiré.

- **Méthode** : `DELETE`
- **URL** : `/api/projects/:projectId/members/:userId`
- **Auth** : utilisateur connecté obligatoire
- **Headers requis** :
  - `Authorization` / cookie
  - `X-Request-Id`

**Request**

- `path params` :
  - `projectId` : identifiant du projet
  - `userId` : identifiant du membre à retirer
- `body` : aucun

**Response – 200**

```json
{
  "id": "uuid-projet",
  "name": "Mon projet",
  "ownerId": "uuid-owner",
  "memberIds": ["uuid-owner"],
  "status": "open",
  "createdAt": "2025-01-01T10:00:00.000Z"
}
```

**Erreurs**

- `401` – `{ "error": "UNAUTHENTICATED", "message": "User must be authenticated" }`
- `403` – `{ "error": "FORBIDDEN", "message": "Only owner can remove members" }`
- `404` – `{ "error": "NOT_FOUND", "message": "Project or member not found" }`
- (Phase 4) `409` possible si règles supplémentaires sur les tâches assignées sont appliquées.
- `502` – `{ "error": "UPSTREAM_UNAVAILABLE", "message": "project-service unavailable" }`

---

## 2. Mapping Gateway → project-service

Notation :

- `PROJECT_SERVICE_URL` : base URL interne du service (ex. `http://project-service:3001`).
- `x-user-id` : header propagé vers `project-service`.
- `x-request-id` : header de corrélation propagé.

### 2.1. Tableau de mapping

| Route Gateway | Route interne project-service | Mapping requête | Mapping réponse | Mapping erreurs |
|---------------|------------------------------|-----------------|-----------------|-----------------|
| `GET /api/projects` | `GET /projects` | Copie des headers standards ; ajoute `X-Request-Id` si manquant | Body renvoyé tel quel | En cas d’erreur réseau → `502 UPSTREAM_UNAVAILABLE` |
| `POST /api/projects` | `POST /projects` | `X-User-Id` = `userId` extrait par l’auth du Gateway ; body JSON copié | Body projet renvoyé tel quel | Statuts/erreurs propagés tels quels (`400/401/...`) ; erreurs réseau → `502` |
| `PATCH /api/projects/:projectId` | `PATCH /projects/:id` | `:id` = `:projectId` ; `X-User-Id` injecté ; body copié (filtré aux champs supportés) | Projet renvoyé tel quel | `INVALID_INPUT/NOT_FOUND/FORBIDDEN/CONFLICT` convertis en mêmes statuts ; erreurs réseau → `502` |
| `POST /api/projects/:projectId/close` | `POST /projects/:id/close` | `:id` = `:projectId` ; `X-User-Id` injecté | Projet renvoyé tel quel | Même mapping que ci-dessus | 
| `POST /api/projects/:projectId/members` | `POST /projects/:id/members` | `:id` = `:projectId` ; `X-User-Id` injecté ; body copié | Projet renvoyé tel quel | Même mapping que ci-dessus |
| `DELETE /api/projects/:projectId/members/:userId` | `DELETE /projects/:id/members/:userId` | `:id` = `:projectId` ; `:userId` propagé ; `X-User-Id` injecté | Projet renvoyé tel quel | Même mapping que ci-dessus |

**Principe** : le Gateway ne transforme **pas** la structure métier des payloads ; il se contente de :

- injecter les headers de contexte (`X-User-Id`, `X-Request-Id`) ;
- adapter les chemins (`/api/projects/...` → `/projects/...`) ;
- envelopper les erreurs réseau en `502/503` génériques.

---

## 3. Auth, userId et headers de contexte

L’authentification et l’extraction du `userId` sont entièrement gérées par la **base Gateway** (partie Jeremy) à partir du token/session.

Pour les routes projets/membres :

- Les endpoints suivants exigent un **utilisateur connecté** :  
  `POST /api/projects`, `PATCH /api/projects/:projectId`, `POST /api/projects/:projectId/close`, `POST /api/projects/:projectId/members`, `DELETE /api/projects/:projectId/members/:userId`.
- `GET /api/projects` est aligné sur `GET /projects` et peut rester accessible sans auth (à ajuster si le besoin de filtrage par user apparaît).

### 3.1. Conventions de headers Gateway → project-service

Pour chaque appel vers `project-service`, le Gateway doit :

- poser `X-User-Id: <userId>` pour toutes les routes protégées (obligatoire, sinon `project-service` renvoie `401`) ;
- propager ou générer `X-Request-Id` pour suivre la requête de bout en bout ;
- propager les autres headers utiles (trace-id, correlation-id) selon les règles globales d’architecture.

### 3.2. Gestion des statuts 401 / 403

- **401 côté Gateway** : 
  - renvoyé si aucun `userId` n’est disponible dans le contexte auth du Gateway (token manquant/invalidé) **avant même** d’appeler `project-service`.
- **403 côté Gateway** : 
  - provient principalement du `FORBIDDEN` retourné par `project-service` (ex. user non owner) ;
  - le Gateway propage le statut et le body `{ error, message }` sans surcouche métier.

---

## 4. Format des erreurs standard

Le Gateway expose un format d’erreur JSON homogène inspiré de `project-service` :

```json
{
  "error": "CODE",
  "message": "Human readable message"
}
```

Codes possibles (non exhaustif) côté projets :

- `INVALID_INPUT`
- `NOT_FOUND`
- `FORBIDDEN`
- `CONFLICT`
- `UNAUTHENTICATED`
- `UPSTREAM_UNAVAILABLE`

Les erreurs de validation et de droits renvoyées par `project-service` sont propagées **telles quelles** (même `error`, même `message`), seule la couche d’auth propre au Gateway introduit `UNAUTHENTICATED`.

---

## 5. Scénarios E2E via le Gateway (projets & membres)

Ces scénarios servent de base aux tests manuels ou automatisés.

### 5.1. Création de projet

1. `POST /api/auth/login` → obtention token/session (partie Jeremy).
2. `POST /api/projects` avec body `{ "name": "Projet A" }`.
3. Attendu :
   - réponse `201` avec un objet projet complet ;
   - `ownerId` = `userId` du user loggué ;
   - `memberIds` contient au moins `ownerId`.

### 5.2. Ajout de membre par le chef de projet

1. Création projet via scénario 5.1.
2. `POST /api/projects/:projectId/members` avec body `{ "userId": "uuid-autre-user" }`.
3. Attendu :
   - réponse `200` ;
   - `memberIds` contient l’`ownerId` et le nouveau `userId`.

### 5.3. Tentative d’ajout par un non-chef

1. Projet créé par `userA`.
2. `userB` se connecte et appelle `POST /api/projects/:projectId/members`.
3. Attendu : `403 FORBIDDEN` avec un body `{ "error": "FORBIDDEN", "message": "Only owner can add members" }`.

### 5.4. Retrait de membre

1. Projet avec `ownerId` = `userA` et membre `userB`.
2. `userA` appelle `DELETE /api/projects/:projectId/members/:userId` pour retirer `userB`.
3. Attendu :
   - réponse `200` ;
   - `memberIds` ne contient plus `userB`.

### 5.5. Clôture de projet

1. Projet avec toutes les tâches complétées (précondition assurée par `task-service` + événements).
2. `userA` (owner) appelle `POST /api/projects/:projectId/close`.
3. Attendu :
   - réponse `200` ;
   - `status` = `closed`.

Pour chaque scénario :

- vérifier que `X-Request-Id` est identique dans les logs du Gateway et de `project-service` ;
- vérifier que les statuts et bodies d’erreur respectent le contrat défini ci-dessus.

---

## 6. Intégration dans la phase 5

- Ce document est la **référence détaillée** pour la partie « Tristan – Routes Gateway ↔ Project-service » de la phase 5.
- La section phase 5 ne liste que les grandes lignes ; pour les payloads et statuts détaillés, se référer à `doc/architecture/gateway-project-service.md`.

Avant implémentation des routes Gateway :

- relire ce document avec l’équipe (front + backend) ;
- ajuster si besoin la surface d’API (nouveaux filtres, pagination sur `GET /api/projects`, etc.) ;
- une fois validé, considérer ce contrat comme **stable** pour le frontend.

