# Phase 5 – API Gateway (point d’entrée) – Répartition des tâches

**Objectif :** mettre en place un **API Gateway unique** devant le monolithe puis les microservices, pour centraliser auth / logs / protection basique, tout en laissant les services métier centrés sur leur logique.

Référence : section « 5. API Gateway (point d’entrée) » du [plan de refonte architecture](../../plan-refonte-architecture.md) et [ADR 002 – API Gateway vs BFF](../../adr/adr-002-api-gateway-vs-bff.md).

**Ordre recommandé :**
- Jeremy pose la **base clean du Gateway + toute l’auth** (intégration `auth-service`, validation, contexte `userId`).
- Ensuite Tristan branche les routes projets, Paul les routes tâches.
- Enfin Jeremy branche la partie notifications (côté Gateway) pour rester aligné avec le `notification-service`.

---

## Prérequis

- **Phases 2 à 4 validées** : services `auth-service`, `project-service`, `task-service`, `notification-service` en place et fonctionnels (cas d’usage + events).
- **Contrats d’API back** relativement stables (endpoints des services métier connus).
- **ADR 002** validé : API Gateway unique, pas de BFF spécifique pour l’instant.

---

## Jeremy – Base API Gateway & Auth

**Responsable :** Jeremy

**Périmètre :** créer le projet API Gateway, la structure, la config Docker / Compose, les middlewares transverses, **et couvrir toute l’auth côté Gateway** (intégration `auth-service`, validation des tokens, exposition des endpoints auth au frontend).

**À faire (quoi) :**

1. **Projet et structure**
   - Créer un dossier dédié (ex. `services/api-gateway/`).
   - Ajouter un `package.json` avec scripts de base (`dev`, `start`, `test` si besoin).
   - Mettre en place une structure simple : fichier d’entrée (serveur HTTP / reverse proxy), dossier `routes/` (ou équivalent), dossier `middlewares/`.

2. **Intégration Docker / Compose**
   - Ajouter un `Dockerfile` pour l’API Gateway.
   - Brancher l’API Gateway dans `docker-compose.yml` (exposer un port unique pour le frontend, ex. `http://localhost:3000` ou autre).
   - Définir les variables d’environnement nécessaires pour atteindre les services internes (ex. `AUTH_SERVICE_URL`, `PROJECT_SERVICE_URL`, `TASK_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`).

3. **Middlewares transverses (base)**
   - Logging simple des requêtes (méthode, path, code retour).

4. **Auth / contexte utilisateur (couvre toute l’auth en place)**
   - Exposer via le Gateway les endpoints d’auth déjà décidés :
     - `POST /api/auth/register` → proxie vers `auth-service` (inscription).
     - `POST /api/auth/login` → proxie vers `auth-service` (connexion, récupération du token/session).
     - `GET /api/auth/me` → proxie vers `auth-service` (utilisateur courant).
   - Définir comment le Gateway valide les requêtes protégées :
     - soit en appelant un endpoint de validation dans `auth-service`,
     - soit via une lib commune, mais **toujours** en s’alignant sur le contrat d’auth existant.
   - Extraire un `userId` fiable (depuis le token/session) et le propager dans les headers vers les services internes (sans réimplémenter d’auth métier dans le Gateway).

5. **Documentation**
   - Documenter dans un court README du Gateway :
     - ports exposés,
     - variables d’environnement,
     - conventions de headers (ex. `x-user-id`, `x-request-id`),
     - rappel : **pas de logique métier dans le Gateway**.

**Livrable :** un service `api-gateway` démarrable (via Docker Compose), avec middlewares transverses en place, prêt à accueillir les routes spécifiques project / task / notifications.

---

## Tristan – Routes Gateway ↔ Project-service

**Responsable :** Tristan

**Périmètre :** définir et implémenter les routes exposées par le Gateway pour tout ce qui touche aux projets et membres, en les faisant pointer vers `project-service`.

**À faire (quoi) :**

1. **Contrat côté Gateway**
   - Lister les endpoints « projets » que le frontend utilisera via le Gateway (exemples à adapter) :
     - `GET /api/projects`
     - `POST /api/projects`
     - `POST /api/projects/:projectId/members`
     - `DELETE /api/projects/:projectId/members/:userId`
     - `POST /api/projects/:projectId/close`
   - Vérifier que ces routes restent cohérentes avec ce qui existe déjà côté `project-service` (adapter si besoin par un mapping simple).

2. **Implémentation des routes dans le Gateway**
   - Ajouter les handlers correspondants dans le projet Gateway (dossier `routes/projects` ou équivalent).
   - Pour chaque route :
     - Récupérer le `userId` depuis le middleware d’auth du Gateway.
     - Construire l’appel HTTP vers `project-service` (URL, méthode, body, headers).
     - Propager les headers nécessaires (`x-user-id`, `x-request-id`, etc.).
     - Retourner la réponse du service au frontend (en évitant de réimplémenter de la logique métier).

3. **Gestion des erreurs / statuts**
   - Harmoniser les codes de retour envoyés au frontend (ex. 4xx/5xx) en se basant sur les retours de `project-service`.
   - S’assurer que les messages d’erreur restent suffisamment explicites pour le frontend, sans exposer de détails techniques internes.

4. **Vérifications**
   - Tests manuels ou automatisés : créer un projet, ajouter un membre, fermer un projet **via le Gateway**, sans appeler directement `project-service`.
   - Vérifier que les logs et `requestId` sont bien propagés.

**Livrable :** l’ensemble des opérations projet/membres accessibles depuis le frontend via l’API Gateway, en s’appuyant sur `project-service` sans logique métier dupliquée.

---

## Paul – Routes Gateway ↔ Task-service

**Responsable :** Paul

**Périmètre :** définir et implémenter les routes exposées par le Gateway pour les tâches (`task-service`).

**À faire (quoi) :**

1. **Contrat côté Gateway – tâches**
   - Lister les endpoints « tâches » que le frontend utilisera via le Gateway (exemples à adapter) :
     - `GET /api/projects/:projectId/tasks`
     - `POST /api/projects/:projectId/tasks`
     - `POST /api/tasks/:taskId/assign`
     - `POST /api/tasks/:taskId/complete`
     - `POST /api/tasks/:taskId/reopen`
   - S’aligner sur les endpoints réels exposés par `task-service` (mapping simple si nécessaire).

2. **Implémentation des routes tâches dans le Gateway**
   - Ajouter les handlers correspondants (dossier `routes/tasks` ou équivalent).
   - Utiliser le `userId` du contexte Gateway pour les champs comme `createdBy` ou les contrôles d’accès côté `task-service`.
   - Déléguer la validation métier à `task-service`, ne pas la dupliquer dans le Gateway.

3. **Vérifications**
   - Tests manuels ou automatisés via le Gateway :
     - Création de tâche, assignation, complétion → vérifier que les appels passent bien par le Gateway.

**Livrable :** toutes les opérations tâches sont accessibles via l’API Gateway, sans que le frontend parle directement aux services internes.

---

## Jeremy – Routes Gateway ↔ Notification-service

**Responsable :** Jeremy

**Périmètre :** définir et implémenter les routes exposées par le Gateway pour la **consultation des notifications**, en s’alignant sur le comportement du `notification-service`.

**À faire (quoi) :**

1. **Contrat côté Gateway – notifications**
   - Exposer un ou quelques endpoints simples pour la lecture des notifications, par ex. :
     - `GET /api/notifications` (notifications du user courant).
   - Faire pointer ces routes vers `notification-service` (en lui passant le `userId` courant récupéré par l’auth du Gateway).

2. **Implémentation des routes notifications dans le Gateway**
   - Créer les handlers correspondants (dossier `routes/notifications` ou équivalent).
   - Appeler `notification-service` avec le bon `userId` (via header ou paramètre selon le contrat du service).
   - Retourner au frontend une liste de notifications, avec au maximum un mapping léger (formatage) mais **sans toucher aux règles métier** (déjà gérées dans `notification-service`).

3. **Vérifications**
   - Tests manuels ou automatisés via le Gateway :
     - Scénario type : création / assignation / complétion de tâche → `GET /api/notifications` retourne les notifications attendues pour l’utilisateur courant.

**Livrable :** la lecture des notifications est accessible via l’API Gateway, en s’appuyant sur `notification-service`, sans que le frontend parle directement au service interne.

---

## Règles communes

- **Pas de logique métier dans le Gateway** : uniquement auth, routage, logs, agrégation très légère si nécessaire (formatage de réponse), mais aucune règle métier projet / tâche / notification.
- **Propagation du contexte** : toujours propager `userId` et `requestId` (ou équivalent) vers les services internes.
- **Un seul point d’entrée pour le frontend** : le frontend ne doit plus appeler directement `project-service`, `task-service` ou `notification-service`.
- **Contrats stables** : une fois les endpoints Gateway stabilisés, les considérer comme contrat principal pour le frontend ; les changements internes côté services doivent, autant que possible, être masqués derrière le Gateway.

---

## Critères de validation

- `api-gateway` présent dans le mono-repo avec `package.json`, `Dockerfile`, middlewares transverses et intégration Docker Compose.
- Frontend (ou client manuel) utilise **exclusivement** l’API Gateway pour accéder aux projets, tâches et notifications.
- Les services internes restent focalisés sur le métier et n’implémentent pas de concerns transverses (auth, logs, rate limiting).
- Les logs montrent un `requestId` cohérent entre Gateway et services internes.
- Les routes projet / tâche / notifications fonctionnent de bout en bout via le Gateway (tests manuels ou automatisés).

