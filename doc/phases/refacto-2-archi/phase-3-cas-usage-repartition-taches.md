# Phase 3 – Implémentation des cas d’usage métier – Répartition des tâches

**Objectif :** faire vivre la logique métier dans les services (project-service, task-service), avec persistance et règles métier documentées, sans encore brancher la communication événementielle entre services (phase 4).

Référence : section « 3. Implémentation des cas d’usage métier » du [plan de refonte architecture](../../plan-refonte-architecture.md) et les règles métier par service ([project](./../../regles-metier-project-service.md), [task](./../../regles-metier-task-service.md), [notification](./../../regles-metier-notification-service.md)).

**Ordre recommandé :** project-service en premier (projets et membres), puis task-service (tâches et affectations). Notification-service peut rester minimal en phase 3 (modèle + structure d’écoute), l’écoute réelle des événements venant en phase 4.

---

## Prérequis

- **Phase 2 validée** : quatre services présents, auth-service opérationnel (register / login / me), docker-compose avec Redis, pas d’import inter-service, `npm run lint:deps` et `npm test` verts.
- Les services project, task et notification sont des squelettes (GET / uniquement) ; on y ajoute domaine, persistance et cas d’usage.

---

## Tristan – Project-service (projets et membres)

**Responsable :** Tristan

**Périmètre :** `project-service` — tout ce qui concerne la création et la gestion des projets et de leurs membres.

**À faire (quoi) :**

1. **Modèle et persistance**
   - Définir le modèle **Project** (id, name, ownerId, membres, statut ouvert/fermé, etc.) aligné sur [règles métier Project-service](../../regles-metier-project-service.md).
   - Mettre en place la persistance (port + implémentation SQLite + InMemory pour les tests), sur le même schéma que auth-service (ports, factory, injection). Stockage des projets et de la liste des membres par projet.

2. **Cas d’usage à exposer**
   - **Création d’un projet** : nom, ownerId (utilisateur courant) ; le créateur devient chef de projet et membre.
   - **Ajout d’un membre à un projet** : réservé au chef de projet ; un utilisateur ne peut pas être ajouté deux fois.
   - **Retrait d’un membre** : réservé au chef de projet ; le membre ne peut être retiré que s’il n’a plus aucune tâche du projet qui lui est assignée (règle métier ; la vérification avec task-service sera faite via contrat/événement en phase 4, ou via un appel temporaire documenté).
   - **Modification des métadonnées du projet** (nom, etc.) : réservée au chef de projet, interdite si le projet est clôturé.
   - **Clôture d’un projet** : réservée au chef de projet ; le projet ne peut être clôturé que si toutes les tâches sont terminées (coordination avec task-service à préciser : read model, API temporaire ou événement en phase 4).
   - **Suppression d’un projet** (optionnel en phase 3) : réservée au chef de projet ; à documenter si report en phase 4.

3. **Exposition HTTP**
   - Exposer les cas d’usage via des routes REST (création projet, ajout/retrait membre, mise à jour, clôture). Identifier l’utilisateur courant via un contexte (header, token ou session selon ce qui est décidé avec auth-service / futur gateway).

4. **Documentation**
   - Documenter les endpoints et les règles métier appliquées dans le README du service (ou fichier dédié).

**Livrable :** project-service opérationnel avec persistance, cas d’usage implémentés, règles métier respectées, tests et doc à jour.

---

## Paul – Task-service (tâches et affectations)

**Responsable :** Paul

**Périmètre :** `task-service` — tout ce qui concerne la création et la gestion des tâches et leur affectation à des membres de projet.

**À faire (quoi) :**

1. **Modèle et persistance**
   - Définir le modèle **Task** (id, title, projectId, createdBy, assignedTo, completed, status, priority, dueDate, etc.) aligné sur [règles métier Task-service](../../regles-metier-task-service.md).
   - Mettre en place la persistance (port + SQLite + InMemory), même pattern que auth-service et project-service.

2. **Cas d’usage à exposer**
   - **Création d’une tâche** : liée à un projet existant ; titre obligatoire ; affectation initiale optionnelle (l’assigné doit être membre du projet — validation à coordonner avec project-service, voir phase 4 si pas d’appel HTTP).
   - **Affectation / désaffectation** : une tâche au plus un assigné ; l’assigné doit être membre du projet ; règle de capacité (une seule tâche active par personne) selon les règles métier.
   - **Marquer une tâche comme terminée** (statut done).
   - **Réouvrir une tâche** : interdite si le projet est clôturé.
   - **Modification d’une tâche** (titre, statut, priorité, dueDate, etc.) pour les tâches non clôturées et projet ouvert.
   - **Suppression d’une tâche** (optionnel) : selon les règles métier.

3. **Exposition HTTP**
   - Exposer les cas d’usage via des routes REST ; identifier l’utilisateur courant pour createdBy / permissions.

4. **Coordination avec project-service**
   - Vérifier « membre du projet » et « projet ouvert » : en phase 3, soit via un contrat minimal (API ou read model partagé), soit en reportant les contrôles stricts en phase 4 (événements / données dérivées). Documenter le choix.

5. **Documentation**
   - Documenter les endpoints et les règles métier dans le README du service.

**Livrable :** task-service opérationnel avec persistance, cas d’usage implémentés, règles métier respectées, tests et doc à jour.

---

## Jeremy – Notification-service (préparation phase 4)

**Responsable :** Jeremy

**Périmètre :** `notification-service` — préparer le service à consommer des événements métier sans encore brancher le broker.

**À faire (quoi) :**

1. **Modèle et persistance**
   - Définir le modèle **Notification** (id, userId, message, type, createdAt, etc.) aligné sur [règles métier Notification-service](../../regles-metier-notification-service.md).
   - Mettre en place la persistance (port + SQLite + InMemory) pour stocker les notifications créées.

2. **Structure d’écoute (sans broker réel pour l’instant)**
   - Introduire un port **EventBus** (consommation) ou équivalent et une structure de handlers par type d’événement (TaskAssigned, TaskCompleted, ProjectClosed, etc.) avec une implémentation vide ou stub. L’objectif est que, en phase 4, brancher Redis revienne à injecter la vraie implémentation sans refondre le service.

3. **Règle métier à intégrer dès que des événements seront reçus**
   - Pas de notification si `actionUserId === targetUserId` (documenté et prêt à être appliqué en phase 4).

4. **Documentation**
   - Documenter le modèle de notification et le mapping prévu événements → destinataires (voir règles métier).

**Livrable :** notification-service avec modèle, persistance et structure prête à recevoir les événements en phase 4 ; pas d’écoute Redis en phase 3.

---

## Règles communes

- **Pas d’import inter-service** : respecter les règles dependency-cruiser ; la coordination project / task (membres, clôture, tâches terminées) se fait par contrat à définir (API temporaire, read model ou report en phase 4).
- **Pas d’appel HTTP direct entre services** (sauf si un contrat temporaire est décidé et documenté pour la phase 3).
- **Use cases comme point d’entrée** : la logique métier est dans des cas d’usage explicites ; les routes HTTP délèguent à ces cas d’usage. Pas de logique métier dans les routes ni dans les repositories.
- **Tests** : chaque service doit avoir des tests (unitaires et/ou intégration) pour les cas d’usage et la persistance.
- **Documentation** : mettre à jour les README des services et les références croisées (plan refonte, règles métier).

---

## Critères de validation

- project-service : création projet, ajout/retrait membre, modification, clôture (selon règles) ; persistance et tests OK.
- task-service : création tâche, affectation, passage en done, réouverture, modification ; persistance et tests OK.
- notification-service : modèle et persistance en place, structure des handlers documentée ; prêt pour phase 4.
- Aucun import inter-service ; `npm run lint:deps` et `npm test` verts.
- docker-compose et auth-service inchangés côté contrat (les nouveaux endpoints project/task sont consommables manuellement ou par un client à définir).

---

## Hors périmètre (phase 3)

- **Publication / souscription réelle aux événements** (Redis, EventBus implémenté) : phase 4.
- **Notification-service** : pas d’écoute broker en phase 3, uniquement préparation.
- **Frontend / monolithe** : pas d’obligation de brancher le monolithe ou le front sur les nouveaux endpoints en phase 3 ; on peut valider les services via tests et appels manuels (curl, Postman).
- **Gateway / BFF** : hors scope phase 3.
