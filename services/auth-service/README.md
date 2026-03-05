# auth-service – Authentification minimale (Phase 2)

Service d’authentification dédié, responsable de :

- la création d’utilisateurs (`register`) ;
- la connexion (`login`) ;
- la récupération de l’utilisateur courant (`me`).

Les utilisateurs sont stockés dans une base SQLite locale au service (`data/auth-users.db` par défaut) via `UserRepository`.

## Endpoints

### POST /auth/register

Crée un utilisateur.

- **Body JSON** :

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Réponses** :
  - `201` :

    ```json
    {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-03-05T12:00:00.000Z"
    }
    ```

  - `400` : input invalide (`email` ou `password` manquant / invalide).
  - `409` : email déjà utilisé.

### POST /auth/login

Authentifie l’utilisateur et initialise une **session HTTP** (cookie `HttpOnly` géré par `express-session`).

- **Body JSON** :

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Réponses** :
  - `200` : credentials valides, session créée.

    ```json
    {
      "ok": true,
      "user": {
        "id": "uuid",
        "email": "user@example.com"
      }
    }
    ```

    Un cookie de session est renvoyé dans l’en-tête `Set-Cookie`.

  - `400` : input invalide.
  - `401` : credentials invalides.

### GET /auth/me

Retourne l’utilisateur courant à partir de la session.

- **Requête** : doit inclure le cookie de session retourné par `/auth/login`.

- **Réponses** :
  - `200` :

    ```json
    {
      "id": "uuid",
      "email": "user@example.com"
    }
    ```

  - `401` : aucune session valide (`Unauthorized`).

## Sessions et sécurité

- Les sessions sont gérées par `express-session` dans `src/index.ts`.
- Le secret de signature est lu via la variable d’environnement `SESSION_SECRET` (fallback `dev-secret` en dev).
- Le cookie est marqué `HttpOnly` pour éviter l’accès JavaScript.
- Les mots de passe sont hashés avec `bcrypt` (`hashPassword` / `verifyPassword` dans `src/domain/password.ts`) et jamais retournés par l’API.

## Lancement rapide

Dans `services/auth-service` :

```bash
npm install
npm run build
npm start
```

Par défaut, le service écoute sur le port `3004` (configurable via `PORT`).

Tests d’intégration des routes :

```bash
cd /Users/jeremyd/ynov/refacto
npm test -- spec/auth-service/authRoutes.spec.ts
```

