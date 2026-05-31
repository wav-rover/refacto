# API Gateway — tests à ajouter

Checklist des tests à implémenter pour le proxy/BFF léger : authentification via auth-service, propagation des headers (`x-user-id`, `x-request-id`, `cookie`), relais vers les services aval et mapping des erreurs (**503** auth indisponible, **502** service aval indisponible).

**État actuel** : Jest + supertest configurés (`jest.config.ts`, `package.json`), dossier `spec/` attendu, **aucun `*.spec.ts` encore**. `createApp()` est exporté depuis `server.ts` ; `listen()` est ignoré si `NODE_ENV=test`.

---

## Prérequis techniques

- [ ] Tester via `createApp()` + `supertest` (pas de `listen()` en test).
- [ ] Mock HTTP : `jest.spyOn(global, 'fetch')` ou mock de `forwardJson` selon le niveau.
- [ ] Variables d’environnement des URLs de services (`AUTH_SERVICE_URL`, `PROJECT_SERVICE_URL`, etc.) pour les intégrations.
- [ ] Arborescence cible :

```
services/api-gateway/spec/
  infra/httpClient.spec.ts
  middlewares/requireAuthGateway.spec.ts
  middlewares/requestId.spec.ts
  middlewares/cors.spec.ts              # optionnel
  middlewares/logger.spec.ts            # optionnel
  routes/projects.integration.spec.ts
  routes/tasks.integration.spec.ts
  routes/notifications.integration.spec.ts
  routes/auth.integration.spec.ts
```

---

## 1. Tests unitaires — `forwardJson` (`spec/infra/httpClient.spec.ts`)

Brique la plus réutilisée. Mocker `global.fetch` et vérifier construction + parsing.

| # | Cas | Attendu |
|---|-----|---------|
| 1 | Normalisation d’URL | `baseUrl` finissant par `/` + `path` commençant par `/` → une seule barre (`http://svc/projects`, pas `//`) |
| 2 | Headers `undefined` | Clé ignorée |
| 3 | Headers tableau | `append` (plusieurs valeurs pour la même clé) |
| 4 | Headers string | `set` |
| 5 | `content-type` auto | Body présent + méthode ≠ GET → `application/json` si absent |
| 6 | `content-type` existant | Non écrasé |
| 7 | GET avec `body` dans options | Pas de body envoyé à `fetch` |
| 8 | Réponse corps vide | `body: null` |
| 9 | Réponse JSON valide | Objet parsé ; retour `{ status, headers, body }` |
| 10 | Réponse non vide non-JSON | `JSON.parse` lève une exception — **documente une fragilité** (en prod → 502/503 via catch des routes, pas message propre) |

**Priorité** : P0

---

## 2. Tests unitaires — `requireAuthGateway` (`spec/middlewares/requireAuthGateway.spec.ts`)

Middleware de sécurité. Mock `forwardJson` (ou `fetch`). Simuler `req` / `res` / `next`.

| # | Cas | Attendu |
|---|-----|---------|
| 1 | Auth `/auth/me` → 200 + `{ id: string }` | `next()` appelé ; `req.auth.userId` et `req.headers['x-user-id']` positionnés |
| 2 | 200 sans `id` ou `id` non-string | **503** `{ error: "Auth service unavailable" }` ; `next()` non appelé |
| 3 | 401 / 403 amont | Même status + body ; `next()` non appelé |
| 4 | 500 (ou autre hors 200/401/403) amont | **503** |
| 5 | `forwardJson` / fetch qui throw | **503** |
| 6 | **Anti-spoofing** | Client envoie `x-user-id: victime` ; auth OK pour `user-reel` → header **écrasé** par `user-reel` |

Vérifier aussi que l’appel vers auth propage **cookie**, **accept**, **user-agent**.

**Priorité** : P0 (surtout le cas 6)

---

## 3. Tests unitaires — `requestId` (`spec/middlewares/requestId.spec.ts`)

| # | Cas | Attendu |
|---|-----|---------|
| 1 | Pas de `x-request-id` entrant | UUID généré sur `req.headers` et en-tête de réponse |
| 2 | `x-request-id` fourni | Valeur conservée |
| 3 | `x-request-id` vide | Traité comme absent → génération |

**Priorité** : P1

---

## 4. Tests unitaires — autres middlewares (optionnel)

### `cors.spec.ts`

- [ ] Avec `FRONTEND_ORIGIN` : origin autorisée → `Access-Control-Allow-Origin`
- [ ] `OPTIONS` → **204**
- [ ] Sans env : pas de crash, `next()` appelé

### `logger.spec.ts`

- [ ] Une requête complète sans throw
- [ ] (Optionnel) spy `console.log` sur événement `finish`

**Priorité** : P3

---

## 5. Tests d’intégration — routes (`supertest` + `fetch` mocké)

`createApp()` + mock en chaîne : auth-service pour `requireAuthGateway`, puis service aval.

### Modèle pilote — `projects.integration.spec.ts`

| # | Cas | Attendu |
|---|-----|---------|
| 1 | `GET /api/projects` authentifié | `fetch` aval reçoit `x-user-id` = id résolu par auth, **pas** celui du client |
| 2 | Anti-spoofing E2E | Client `x-user-id: victime` + session valide → aval voit l’id auth |
| 3 | Aval **403** | Client **403** (gateway n’aplatit pas) |
| 4 | Aval injoignable (fetch throw) | **502** `{ error: "UPSTREAM_UNAVAILABLE", message: "project-service unavailable" }` |
| 5 | Route protégée sans session | **401** ; **aucun** appel project-service |
| 6 | Paramètres d’URL | Ex. `DELETE /api/projects/:projectId/members/:userId` → path `/projects/{projectId}/members/{userId}` |

Étendre (selon besoin de couverture) aux autres handlers projects : `POST /`, `PATCH /:projectId`, `POST /:projectId/close`, `POST /:projectId/members`, etc.

**Priorité** : P1

### `tasks.integration.spec.ts`

**Routes protégées** (après `router.use(requireAuthGateway)`) — même matrice que projects :

- [ ] Propagation `x-user-id` (auth, pas client)
- [ ] Status aval relayé (ex. 403)
- [ ] 502 si task-service down
- [ ] 401 sans auth, pas d’appel aval

**Routes publiques** (`GET /`, `/project/:projectId`, `/user/:userId`, `GET /:id`) :

- [ ] Pas d’exigence `x-user-id` côté gateway
- [ ] 502 si task-service down
- [ ] Params URL transmis (`:projectId`, `:id`, `:userId`)

**Priorité** : P2

### `notifications.integration.spec.ts`

Router entièrement protégé :

- [ ] Auth + headers + 502 + 401 sans session (même modèle que projects)

**Priorité** : P2

### `auth.integration.spec.ts`

Pas de `requireAuthGateway` sur ces routes.

- [ ] `POST /api/auth/register` — status + body relayés
- [ ] `POST /api/auth/login` — status + body ; **set-cookie** remonté si présent
- [ ] `GET /api/auth/me` — relais cookie / status amont
- [ ] `POST /api/auth/logout` — **204** sans body JSON côté gateway

**Priorité** : P2

---

## Lacunes d’implémentation (pas de test tant que non corrigé)

| Sujet | Action recommandée | Test ensuite |
|-------|-------------------|--------------|
| **Pas de timeout** sur `fetch` dans `httpClient` | Ajouter `AbortSignal.timeout` (ou équivalent) | Test : service qui pend → erreur contrôlée dans un délai |
| **`JSON.parse` non protégé** | Gérer corps non-JSON (try/catch ou content-type) | Le test unitaire #10 de `httpClient` documente l’état actuel ; retirer/adapter après fix |

---

## Synthèse des priorités

| Priorité | Fichiers |
|----------|----------|
| **P0** | `httpClient.spec.ts`, `requireAuthGateway.spec.ts` |
| **P1** | `projects.integration.spec.ts`, `requestId.spec.ts` |
| **P2** | `tasks`, `notifications`, `auth` integration |
| **P3** | `cors.spec.ts`, `logger.spec.ts` |

**Volume indicatif** : ~10 cas `httpClient`, ~6 `requireAuthGateway`, ~3 `requestId`, ~6–8 par fichier d’intégration pilote → **~35–50 `it()`** selon exhaustivité sur chaque route HTTP.

---

## Outils

- **Jest** — déjà en place (`npm test` dans `services/api-gateway`)
- **supertest** — déjà en dépendance
- **Mock** — `jest.spyOn(global, 'fetch')` ou MSW pour les intégrations

---

## Références code

- `src/infra/httpClient.ts` — `forwardJson`
- `src/middlewares/requireAuthGateway.ts` — auth BFF
- `src/middlewares/requestId.ts` — traçabilité
- `src/server.ts` — `createApp()`, pas de listen en test
- `src/routes/projects.ts`, `tasks.ts`, `notifications.ts`, `auth.ts` — handlers à couvrir en intégration
