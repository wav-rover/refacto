# Phase 2 (Architecture) – Mise en place du cœur technique – Répartition des tâches

Objectif : mettre en place la structure du mono-repository (services isolés), le service d’authentification (pré-requis) et le message broker, sans implémenter encore les cas d’usage métier ni la communication événementielle entre services.

Référence : section « 2. Mise en place du cœur technique » du [plan de refonte architecture](../../plan-refonte-architecture.md).

Chacun travaille en parallèle sur son périmètre. **Ordre recommandé :** structure en premier → une fois l’arborescence et les squelettes en place, auth et broker + compose peuvent avancer en parallèle. **Option :** Jeremy peut enchaîner structure + auth pour avancer plus vite (même livrables, commits séparés). Branches, commits fréquents.

---

## Prérequis

- **Code actuel stable** : monolithe propre (TypeScript, tests, isolation infra) comme décrit au point de départ du plan.
- **Vérification avant démarrage** : `npm test`, `npm run test:e2e`, `npm run dev` (ou équivalent) passent.

---

## Jeremy – Structure du mono-repository

**Responsable :** Jeremy

**Périmètre :** création de l’arborescence et des squelettes des quatre services (project, task, notification, auth), sans logique métier.

**À faire (dans l’ordre) :**

1. **Créer l’arborescence**  
   À la racine du repo (ou dans un dossier dédié, ex. `services/`) :
   - `services/project-service/`
   - `services/task-service/`
   - `services/notification-service/`
   - `services/auth-service/`

2. **Package.json par service**  
   Chaque service a son propre `package.json` (nom du package, scripts `start`, `test`, `dev` si pertinent, dépendances minimales pour un service Node/Express ou équivalent). Pas de workspace root obligatoire ; l’objectif est l’isolation.

3. **Dockerfile par service**  
   Un `Dockerfile` par service, qui build et expose l’application du service (point d’entrée cohérent avec le `package.json`). Image de base commune (ex. `node:20-alpine`) recommandée. Chaque service doit au minimum démarrer et écouter sur un port (serveur minimal ou health check).

4. **Règle d’isolation**  
   Documenter (ou faire vérifier par dependency-cruiser / lint) : **aucun import inter-service**. Chaque service ne doit dépendre que de ses propres sources et de ses `node_modules`. Aucun `import ... from '../../task-service'` ou équivalent.

**Livrable :** quatre dossiers services avec `package.json` + `Dockerfile`, aucun import croisé ; structure documentée (ex. dans ce fichier ou dans un README `services/README.md`). Les autres (auth, broker + compose) s’appuient sur cette base.

---

## Jeremy – Service d’authentification (pré-requis)

**Responsable :** Jeremy (peut enchaîner après la structure s’il en est responsable).

**Périmètre :** `auth-service` (dans le dossier créé à la tâche structure) : inscription, connexion et récupération de l’utilisateur courant. Utilisateurs stockés en base.

**À faire :**

1. **Modèle utilisateur minimal**  
   Utilisateur avec : `id`, `email`, `password` (hashé), `createdAt`. Persistance (SQLite/Postgres/autre) locale au service.

2. **Endpoints exposés**
   - **Inscription** : `register` (ex. `POST /auth/register` ou `POST /users/register`) – création utilisateur.
   - **Connexion** : `login` (ex. `POST /auth/login`) – retourne un token ou une session permettant d’identifier l’utilisateur.
   - **Utilisateur courant** : `me` (ex. `GET /auth/me` ou `GET /users/me`) – à partir du token/session, retourne l’utilisateur connecté (au minimum `userId` fiable pour les autres services).

3. **Sécurité**  
   Mots de passe hashés (bcrypt ou équivalent) ; pas de stockage en clair. Documenter le format du token/session si consommé plus tard par les autres services.

**Livrable :** auth-service opérationnel (démarrable, testable manuellement ou par spec), trois opérations register / login / me, utilisateurs en base. Contrat documenté pour l’équipe (format token, `userId`).

---

## Paul ou Tristan – Message broker et Docker Compose

**Responsable :** Paul ou Tristan.

**Périmètre :** conteneur message broker (Redis ou RabbitMQ), variables d’environnement, et `docker-compose.yml` pour lancer le broker + les quatre services.

**À faire :**

1. **Conteneur broker**  
   Ajouter un service (ex. `redis` ou `rabbitmq`) dans le `docker-compose.yml` (à la racine ou dans `services/`).

2. **Réseau et variables d’environnement**  
   Les services (project, task, notification, auth) doivent pouvoir atteindre le broker via une URL/host (ex. `REDIS_URL` ou `RABBITMQ_URL`) configurable (env ou `.env`). Documenter les variables attendues.

3. **Compose multi-services**  
   Dans `docker-compose.yml` : définir un service par application (auth-service, project-service, task-service, notification-service) en plus du broker. Chaque service utilise son `Dockerfile` (créés à la tâche structure), avec `depends_on` pour le broker si besoin. Exposer les ports HTTP pour chaque service (ex. auth:3001, project:3002, task:3003, notification:3004).  
   **À ne pas oublier (Docker Desktop) :**
   - Donner un **nom de projet** au compose (ex. `name: todo` en haut du fichier ou `docker compose -p todo up`) afin que les conteneurs soient regroupés sous une même catégorie « todo » dans Docker Desktop.
   - Les services du compose ont déjà des noms explicites (auth-service, project-service, etc.) ; sans compose, un simple `docker run` attribue des noms aléatoires (ex. `priceless_gould`). Le compose évite cela en définissant chaque service avec un nom clair.

4. **Principe à respecter et documenter**  
   Communication inter-services **uniquement via événements** (à implémenter en phase 4) ; **aucun appel HTTP direct** entre project-service, task-service, notification-service. Le documenter dans les règles d’architecture ou dans ce fichier.

5. **Vérification**  
   `docker compose up --build` doit lancer tous les conteneurs sans erreur. Documenter la commande et les URLs/ports d’accès.

**Livrable :** `docker-compose.yml` avec le broker + les quatre services ; variables d’environnement documentées ; convention « pas d’appel HTTP direct inter-services » documentée ; `docker compose up --build` vert.

---

## Règles communes

- **Contrat par service :** une fois un livrable validé (structure, auth, compose), le documenter brièvement (ports, endpoints auth, variables broker) pour que l’équipe s’aligne.
- **Isolation stricte :** aucun import inter-service ; chaque service a son `package.json` et son `Dockerfile`.
- **Pas de logique métier phase 2 :** on ne met en place que la structure, l’auth minimale et le broker ; les use cases et événements métier viennent en phases 3 et 4 du plan.
- **Points de sync (15–20 min) :** après la structure, partager l’arborescence et les conventions ; après auth (Jeremy), valider le contrat register / login / me pour les autres services ; après compose (Paul ou Tristan), vérifier que tout démarre ensemble.

---

## Critères de validation

- Quatre services présents sous `services/` avec chacun : `package.json`, `Dockerfile`, aucun import inter-service.
- Auth-service opérationnel : register, login, me ; utilisateurs stockés en base ; mots de passe hashés.
- Un conteneur message broker (Redis ou RabbitMQ) dans `docker-compose.yml` ; variables d’environnement documentées.
- `docker compose up --build` lance le broker et les quatre services sans erreur.
- Convention documentée : communication inter-services uniquement via événements (broker), pas d’appels HTTP directs entre project / task / notification.

---

## Hors périmètre (ne pas faire en phase 2)

- Implémentation des cas d’usage métier (création projet, tâche, affectation, etc.) – phase 3.
- Publication / souscription aux événements métier (EventBus, TaskCreated, etc.) – phase 4.
- Logique de notifications conditionnelles – phase 5.
- Refactorisation du code métier existant du monolithe vers les services – à faire progressivement après la phase 2.
