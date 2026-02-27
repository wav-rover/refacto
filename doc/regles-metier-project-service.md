## Règles métier – `project-service`

Ce document détaille les règles métier propres au service de gestion des projets.  
Le plan global ne reprend ici que les grandes lignes.

### Rôles et responsabilités

- Un projet possède exactement un responsable (`chef de projet`) identifié par `ownerId`.
- Le créateur du projet est le chef de projet et ce rôle ne change pas ensuite.
- Tous les autres membres du projet ont simplement le rôle `user`.

### Création de projet

- Un projet doit avoir :
  - un `name` non vide ;
  - un `ownerId` valide (utilisateur existant dans le `user-service`).
  - une liste de membres.
- À la création :
  - le propriétaire est automatiquement ajouté à la liste des membres ;
  - le user qui créé est assigné comme owner (chef de projet)

### Gestion des membres

- Seul un chef de projet peut :
  - ajouter un membre ;
  - retirer un membre.
- Un utilisateur ne peut pas être ajouté deux fois au même projet.
- Le chef de projet ne peut pas être retiré du projet.
- Un membre ne peut être retiré du projet que s’il n’a plus **aucune** tâche de ce projet qui lui est assignée, quel que soit le `status` des tâches.

### Modification du projet

- Seul un chef de projet peut modifier les métadonnées d’un projet (nom, description, etc.).
- Les modifications sont interdites si le projet est dans l’état `closed`.

### Clôture de projet

- Un projet ne peut être clôturé que si toutes les tâches associées sont terminées selon les règles du `task-service`.
- clôture explicite : un chef de projet invoque un use case `CloseProject` ;
- Une fois clôturé :
  - le projet passe en état `closed` ;
  - il n’est plus possible de modifier ses métadonnées ni sa liste de membres ;
  - il n’est plus possible de créer ou réouvrir des tâches pour ce projet.

### Suppression de projet

- Seul un chef de projet peut demander la suppression d’un projet.
- La suppression doit gérer :
  - la suppression ou l’archivage des tâches associées (coordination avec `task-service`) ;

### Intégration avec les autres services

- Le `project-service` ne connaît pas les détails d’implémentation du `task-service` ni du `notification-service`.
- Toute interaction passe par :
  - la lecture de modèles en lecture (read models / vues projet) ;
  - des événements métier publiés ou consommés via le broker.
