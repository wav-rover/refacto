## Règles métier – `auth-service`

Ce document reflète **l’implémentation actuelle** de `auth-service`.

### Objectif

- Fournir un `userId` stable et un compte utilisateur minimal (`email` + mot de passe).
- Gérer l’inscription, la connexion et l’accès à l’utilisateur courant.
- Ne **pas** porter la logique métier de projet/tâche.

### Modèle utilisateur (implémenté)

- Champs persistés :
  - `id` (`string`, UUID généré côté service)
  - `email` (`string`, unique, non vide)
  - `passwordHash` (`string`, hash bcrypt)
  - `createdAt` (`string`, ISO 8601)

Il n’y a **pas** de `updatedAt` ni d’édition de profil dans le code actuel.

### Création d’utilisateur (`POST /auth/register`)

- Valide l’input :
  - `email` doit être une string non vide contenant `@` ;
  - `password` doit être une string de longueur ≥ 6.
- Vérifie l’unicité de l’email.
- Hash le mot de passe avec bcrypt.
- Crée un utilisateur en base SQLite (`data/auth-users.db` par défaut).
- Retourne `201` avec `{ id, email, createdAt }`.

### Authentification (`POST /auth/login`)

- Valide l’input (`email`, `password` comme ci‑dessus).
- Vérifie l’email en base et le mot de passe via `verifyPassword`.
- En cas de succès :
  - enregistre `{ id, email }` dans la **session HTTP** (`express-session`, cookie `HttpOnly`) ;
  - retourne `200` avec `{ ok: true, user: { id, email } }`.
- En cas d’échec : `400` (input invalide) ou `401` (credentials invalides).

**Important :** il n’y a pas de JWT dans l’implémentation actuelle, uniquement une session serveur.

### Utilisateur courant (`GET /auth/me`)

- Lit l’utilisateur depuis la session (middleware `requireAuth` + `getSessionUser`).
- Si présent : retourne `200` avec `{ id, email }`.
- Sinon : `401 Unauthorized`.

### Déconnexion (`POST /auth/logout`)

- Détruit la session côté serveur.
- Retourne `204` si la destruction réussit, `500` en cas d’erreur.

### Rôle vis‑à‑vis des autres services

- `auth-service` :
  - ne connaît pas les projets, tâches ou notifications ;
  - fournit seulement un `userId` et un `email`.
- Les autres services identifient l’utilisateur courant soit :
  - via `X-User-Id` (gateway/front, en se basant sur `auth-service`) ;
  - soit, côté front, en appelant `/auth/me` sur le gateway qui proxifie `auth-service`.
