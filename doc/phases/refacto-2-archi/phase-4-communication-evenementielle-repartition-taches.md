# Phase 4 – Communication événementielle (Event-Driven) – Répartition des tâches

**Objectif :** brancher le broker (Redis Streams), faire publier les événements métier par task-service et project-service, faire consommer par notification-service et project-service. Communication inter-services uniquement via événements.

Référence : section « 4. Communication événementielle » du [plan de refonte architecture](../../plan-refonte-architecture.md), [ADR 003 – Broker Redis](../../adr/adr-003-broker-redis-vs-rabbitmq.md), et règles métier ([task](../../regles-metier-task-service.md), [project](../../regles-metier-project-service.md), [notification](../../regles-metier-notification-service.md)).

**Ordre recommandé :** contrat des événements en premier (sync équipe), puis task-service (publication) et notification-service (souscription) peuvent avancer en parallèle ; project-service (écoute + ProjectClosed) après ou en parallèle une fois le contrat fixé.

---

## Prérequis

- **Phase 3 validée** : project-service, task-service et notification-service opérationnels avec cas d’usage, persistance et structure d’écoute côté notification-service. Pas d’import inter-service, `npm run lint:deps` et `npm test` verts.
- Docker Compose avec Redis (phase 2) opérationnel.

---

## Jeremy – Contrat des événements (document partagé)

**Responsable :** Jeremy

**Périmètre :** rédiger un document unique qui fixe les types d’événements, les payloads et les conventions Redis (nom du stream, format des messages) pour que Paul et Tristan implémentent la publication et que notification-service implémente la souscription sans ambiguïté.

**À faire (quoi) :**

1. **Créer le document**  
   Fichier dédié (ex. `doc/architecture/contrat-evenements.md` ou `doc/contrat-evenements.md`) référencé depuis ce fichier et le plan.

2. **Contenu minimal**
   - Liste des types d’événements : `TaskCreated`, `TaskAssigned`, `TaskCompleted`, `TaskReopened`, `TaskDeleted`, `ProjectClosed`.
   - Pour chaque type : champs du payload (ex. `taskId`, `projectId`, `actionUserId`, `targetUserId`, `assignedTo`, `closedAt`, etc.) avec description brève. Les consommateurs (notification-service, project-service) ont besoin de `actionUserId` / `targetUserId` ou équivalent selon le type.
   - Convention Redis Streams : nom du stream (ou des streams) utilisé(s), structure du message (ex. `{ type, payload, timestamp }`).
   - Option : exemple de payload JSON par type pour validation croisée.

3. **Sync équipe**  
   Partager le document avant que Paul et Tristan n’implémentent la publication ; valider en point court (15–20 min) que tout le monde s’aligne sur les noms et champs.

**Livrable :** document `contrat-evenements.md` (ou équivalent) à jour, validé par l’équipe, référencé dans le README des services concernés.

---

## Paul – Task-service (publication des événements)

**Responsable :** Paul

**Périmètre :** `task-service` — injection du port EventBus dans les use cases et publication des événements métier à la fin des opérations réussies.

**À faire (quoi) :**

1. **Port EventBus (publication)**  
   Définir dans le service une interface (port) `EventBus` avec une méthode `publish(eventType, payload)` (ou équivalent). Pas d’appel depuis les routes ni depuis les repositories.

2. **Implémentations**
   - **RedisEventBus** : connexion au Redis du docker-compose (variable d’environnement type `REDIS_URL`), publication dans le stream selon le [contrat des événements](../../architecture/contrat-evenements.md) (à créer par Jeremy). Utiliser Redis Streams (ADR 003), pas uniquement Pub/Sub.
   - **InMemoryEventBus** : implémentation en mémoire pour les tests (stocker les événements émis pour assertions ou pour simuler un consommateur).

3. **Publication dans les use cases**  
   Injecter l’EventBus dans les use cases concernés ; à la **fin** de chaque use case **réussi**, publier l’événement correspondant :
   - Création de tâche → `TaskCreated`
   - Affectation → `TaskAssigned`
   - Tâche marquée terminée → `TaskCompleted`
   - Tâche réouverte → `TaskReopened`
   - Suppression (si implémentée) → `TaskDeleted`  
   Ne jamais publier depuis les routes HTTP ni depuis les repositories.

4. **Tests**  
   Tests unitaires ou d’intégration avec InMemoryEventBus pour vérifier qu’un use case réussi émet bien l’événement attendu (type + payload cohérent).

5. **Documentation**  
   Mettre à jour le README du service : événements publiés, variable d’environnement Redis, référence au contrat des événements.

**Livrable :** task-service publie les cinq événements métier via Redis Streams en prod et via InMemoryEventBus en test ; pas de logique de notification dans le service.

---

## Tristan – Project-service (écoute et publication ProjectClosed)

**Responsable :** Tristan

**Périmètre :** `project-service` — s’abonner aux événements du task-service pour gérer la clôture automatique (optionnel ou selon règles métier) et publier `ProjectClosed` lorsque le projet est clôturé.

**À faire (quoi) :**

1. **Port EventBus (consommation + publication)**  
   - Consommation : s’abonner au(x) stream(s) Redis des événements tâche (selon contrat des événements) pour détecter quand toutes les tâches d’un projet sont terminées (si la clôture automatique est dans le périmètre).
   - Publication : même interface que task-service pour publier `ProjectClosed` (payload : `projectId`, `closedAt`, et champs utiles pour les consommateurs). Implémenter RedisEventBus (publish) + InMemoryEventBus pour les tests.

2. **Logique de clôture**  
   - Si un use case « clôturer le projet » existe déjà (phase 3), à la fin de ce use case réussi : publier `ProjectClosed` (après vérification que toutes les tâches sont terminées, selon contrat avec task-service ou read model).
   - Option : écouter `TaskCompleted` / état des tâches pour proposer une clôture automatique (détail à aligner avec les règles métier project-service).

3. **Implémentations**  
   - RedisEventBus : connexion Redis (subscribe + publish selon besoin), format aligné sur le contrat des événements.
   - InMemoryEventBus pour les tests.

4. **Tests**  
   Tests vérifiant que la clôture publie bien `ProjectClosed` avec le bon payload (et éventuellement que l’écoute des événements tâche déclenche la logique attendue).

5. **Documentation**  
   README : événements consommés (si applicable), événement publié `ProjectClosed`, variables d’environnement.

**Livrable :** project-service publie `ProjectClosed` à la clôture ; optionnellement écoute les événements tâche pour clôture auto ; tests et doc à jour.

---

## Jeremy – Notification-service (souscription et réaction)

**Responsable :** Jeremy

**Périmètre :** `notification-service` — brancher l’écoute réelle du broker (Redis Streams), dispatcher les événements vers les handlers existants (phase 3), créer les notifications via `createNotificationIfAllowed`.

**À faire (quoi) :**

1. **Implémentation réelle de l’EventBus (consommation)**  
   Mettre implémentation qui s’abonne au(x) stream(s) Redis selon le [contrat des événements](../../architecture/contrat-evenements.md). Utiliser Redis Streams (consumer group ou équivalent) pour ne pas perdre d’événements (ADR 003). Garder InMemoryEventBus pour les tests.

2. **Handlers par type d’événement**  
   Pour chaque type consommé (`TaskAssigned`, `TaskCompleted`, `TaskReopened`, `TaskDeleted`, `ProjectClosed`) :
   - Extraire du payload `actionUserId`, `targetUserId` (ou destinataires) selon le mapping des [règles métier notification-service](../../regles-metier-notification-service.md).
   - Appeler `createNotificationIfAllowed(repo, { actionUserId, targetUserId, message, type })` pour respecter la règle « pas de notification si actionUserId === targetUserId ».
   - Persister la notification créée.

3. **Mapping événements → destinataires**  
   Appliquer le mapping documenté (ex. TaskAssigned → utilisateur assigné ; TaskCompleted → chef de projet ; ProjectClosed → membres du projet). Pour `ProjectClosed`, le payload doit contenir les infos nécessaires (ex. liste des membres) ou un mécanisme documenté.

4. **Tests**  
   - Tests d’intégration : émettre un événement (via InMemoryEventBus ou un client Redis de test) et vérifier qu’une notification est créée (ou non selon actionUserId/targetUserId).
   - Conserver les tests unitaires existants sur `createNotificationIfAllowed`.

5. **Documentation**  
   Mettre à jour le README : événements consommés, mapping type → destinataires, variables d’environnement Redis, référence au contrat des événements.

**Livrable :** notification-service écoute le broker, traite les événements métier, crée les notifications selon les règles (actionUserId !== targetUserId) ; tests d’intégration et doc à jour.

---

## Règles communes

- **Contrat des événements** : unique source de vérité pour types et payloads ; aucun appel HTTP direct entre project, task et notification.
- **Publication uniquement depuis les use cases** : jamais depuis les routes ni les repositories.
- **Responsabilité unique** : task-service ne contient aucune logique de notification ; notification-service ne contient pas de logique métier tâche/projet, uniquement interprétation des événements.
- **Redis Streams** : utiliser les Streams (ADR 003) pour la persistance des messages ; pas uniquement Pub/Sub.
- **Tests** : chaque service a des tests (unitaires et/ou intégration) pour la publication ou la réaction aux événements ; pas d’import inter-service.
- **Points de sync** : après rédaction du contrat (Jeremy), validation collective ; après implémentation, vérifier ensemble que publication → consommation fonctionne (ex. test manuel ou E2E léger).

---

## Critères de validation

- Document contrat des événements à jour et validé par l’équipe.
- task-service : publication des événements TaskCreated, TaskAssigned, TaskCompleted, TaskReopened, TaskDeleted à la fin des use cases ; RedisEventBus + InMemoryEventBus ; tests verts.
- project-service : publication de ProjectClosed à la clôture ; (optionnel) écoute des événements tâche ; tests verts.
- notification-service : souscription Redis opérationnelle, handlers créent les notifications via createNotificationIfAllowed, règle actionUserId !== targetUserId respectée ; tests d’intégration verts.
- `docker compose up --build` lance tous les services ; un scénario de bout en bout (ex. création tâche → affectation → complétion → notification reçue) fonctionne manuellement ou en E2E.
- Aucun import inter-service ; `npm run lint:deps` et `npm test` verts dans chaque service.

---

## Hors périmètre (phase 4)

- **Frontend / monolithe** : pas d’obligation de connecter le front ou l’ancien monolithe aux nouveaux flux ; la validation peut se faire via tests et appels manuels (curl, Postman, ou E2E ciblé).
- **Gateway / BFF** : hors scope phase 4.
- **E2E multi-services formel** : les scénarios E2E détaillés (section 6 du plan) peuvent être faits en phase 4 ou en finalisation (section 7) selon la vélocité de l’équipe.
