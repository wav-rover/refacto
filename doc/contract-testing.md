# Contract testing (Pact)

Tests de **contrat consommateur-dirigé** avec [Pact](https://docs.pact.io/) : ils garantissent
que les **attentes** d'un consommateur (ce qu'il envoie / ce qu'il attend en retour) et le
**comportement réel** d'un provider restent compatibles, **sans démarrer toute la stack**.

C'est complémentaire de nos autres niveaux de tests : l'unitaire vérifie la logique métier,
l'E2E vérifie un parcours complet, et le **contrat** verrouille l'interface entre deux services.

## Paires de contrats du système

| Consommateur | Provider | Statut |
|---|---|---|
| **api-gateway** | **auth-service** | ✅ implémenté et vérifié |
| **api-gateway** | **project-service** | ✅ implémenté et vérifié |
| **api-gateway** | **task-service** | ✅ implémenté et vérifié |
| **api-gateway** | **notification-service** | ✅ implémenté et vérifié |
| **frontend** | **api-gateway** | ✅ implémenté et vérifié |

## Fonctionnement (paire api-gateway → auth-service)

1. **Côté consommateur** (`services/api-gateway/contract/auth-service.consumer.pact.ts`)
   - Définit les interactions attendues (ex. `POST /v1/auth/register` → `201`,
     `POST /v1/auth/login` utilisateur inexistant → `401`).
   - Exerce le **vrai client HTTP de la gateway** (`forwardJson` + `getAuthServiceUrl`),
     ce qui capture le chemin **versionné réel** (`/v1/auth/...`).
   - Génère le contrat dans `pacts/api-gateway-auth-service.json`.

2. **Côté provider** (`services/auth-service/contract/verify.ts`)
   - Démarre une vraie instance de l'auth-service (`createApp(repo)` avec un repository
     **in-memory**).
   - **Rejoue** chaque interaction du contrat et vérifie le statut + le corps de réponse.
   - Les **états** (`stateHandlers`) préparent la donnée attendue avant chaque interaction
     (ici : « la base utilisateurs est vide » → réinitialise le repo).

## Lancer les tests

```bash
# Cycle complet : tous les consommateurs génèrent les contrats, puis tous les providers les vérifient
npm run test:pact

# Étapes séparées
npm run test:pact:consumer   # génère les 5 fichiers pacts/ (api-gateway-*.json + frontend-api-gateway.json)
npm run test:pact:provider   # vérifie les 5 contrats (auth, project, task, notification, api-gateway)
```

> Le consommateur doit tourner **avant** le provider (le provider lit le fichier de pact généré).

## Détails techniques (pièges rencontrés)

- **Consommateur sous Jest** : on importe Pact via `@pact-foundation/pact/src/v3` (et non la
  racine du package) pour **éviter de charger le `Verifier`**, dont la dépendance
  `https-proxy-agent` est en ESM et n'est pas transformée par Jest.
- **Provider hors Jest** : la vérification tourne en **script Node** (`ts-node`), où Node 24
  sait charger l'ESM de `https-proxy-agent`. Elle est donc volontairement séparée de la suite
  Jest.
- Les contrats générés (`pacts/`) et les logs sont **git-ignorés** (artefacts régénérables).

## Organisation des fichiers

**Consommateurs** (génèrent les contrats) :
- `services/api-gateway/contract/{auth,project,task,notification}-service.consumer.pact.ts`
  — exercent le vrai client HTTP de la gateway (`forwardJson` + `get*ServiceUrl`).
- `contract/frontend.consumer.pact.ts` (racine) — exerce le client front
  `src/frontend/apiClient.ts`.

**Providers** (vérifient les contrats) :
- `services/{auth,project,task,notification}-service/contract/verify.ts` — démarrent le service
  (app in-memory) et rejouent le contrat avec des `stateHandlers`.
- `services/api-gateway/contract/frontend-provider.verify.ts` — démarre la gateway avec un **mock
  des services aval** (la gateway étant un proxy) et vérifie le contrat du front.

Pour ajouter une **nouvelle interaction** : l'ajouter au fichier consommateur correspondant, puis
le `stateHandler` adéquat dans le `verify.ts` du provider.

## Intégration CI (proposition)

Ajouter une étape `npm run test:pact` :
- dans la **CI incrémentale** quand un service ou la gateway change (rapide, pas de stack) ;
- et/ou sur **main** dans `main-quality.yml`.
Plus tard, un **Pact Broker** permettrait de publier les contrats et de découpler la vérification
provider du run consommateur (au lieu du partage de fichier `pacts/`).
