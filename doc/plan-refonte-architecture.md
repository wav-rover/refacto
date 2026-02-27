# Plan d’évolution vers une architecture distribuée collaborative

**Point de départ :** Monolithe propre (TypeScript, tests, isolation infra, Docker).  
**Objectif :** Évolution vers une architecture microservices event-driven collaborative.

---

# 1. Analyse et conception (DDD & découpage)

## Identification des Bounded Context

- Gestion des projets
- Gestion des tâches
- Gestion des utilisateurs
- Gestion des notifications

## Découpage des services

- `project-service`
  - Création et gestion des projets
  - Gestion des membres d’un projet

- `task-service`
  - Création et gestion des tâches
  - Affectation des tâches à un utilisateur
  - Publication des événements métier

- `notification-service`
  - Écoute des événements
  - Déclenchement conditionnel des notifications

Un service d’authentification dédié gère les utilisateurs et expose un `userId` fiable aux autres services.

## Nouveau modèle métier

### User

- id
- email
- password
- createdAt

### Project

- id
- name
- members: User[]

### Task

- id
- title
- projectId
- assignedTo (userId)
- createdBy (userId)
- completed
- completedAt

---

# 2. Mise en place du cœur technique

## Structure du mono-repository

/services
/project-service
/task-service
/notification-service

Chaque service doit :

- Avoir son propre `package.json`
- Avoir son propre `Dockerfile`
- Être totalement isolé (aucun import inter-service)

## Service d’authentification (pré-requis)

- Un service `auth-service` (ou `user-service`) est disponible.
- Les utilisateurs sont stockés en base.
- L’authentification expose au minimum :
  - inscription (`register`)
  - connexion (`login`)
  - récupération de l’utilisateur courant (`me`)

## Message Broker

- Ajouter un conteneur dédié (Redis ou RabbitMQ) dans `docker-compose.yml`
- Communication inter-services uniquement via événements
- Aucun appel HTTP direct entre services

---

# 3. Implémentation des cas d’usage métier

## Cas d’usage principaux

1. Création d’un projet
2. Ajout d’un utilisateur à un projet
3. Création d’une tâche associée à un projet
4. Affectation d’une tâche à un membre du projet
5. Marquer une tâche comme terminée
6. Réouvrir une tâche
7. Clôturer un projet lorsque toutes les tâches sont terminées

## Règles métier importantes

- Un utilisateur ne peut être assigné à une tâche que s’il appartient au projet.
- La clôture d’un projet est automatique si toutes les tâches sont terminées.

## Publication des événements métier au niveau des use cases

- Implémenter les use cases (création projet, tâche, affectation, etc.) comme unique point d’entrée métier.
- Publier les événements métier uniquement à la fin des use cases **réussis**.
- Injecter un `EventBus` (port) dans les services applicatifs.
- Ne jamais publier d’événement directement depuis :
  - les routes HTTP
  - les repositories / adaptateurs de persistance

### Adaptation progressive de l’existant

- On n’adapte pas immédiatement tous les cas d’usage existants pour publier des événements.
- Dans le monolithe actuel, seule la logique d’`update item` est modifiée pour émettre des événements.

---

# 4. Communication événementielle (Event-Driven)

## Événements métier

- TaskCreated
- TaskAssigned
- TaskCompleted
- TaskReopened

### ProjectClosed

- projectId
- closedAt

## Port EventBus & implémentations

- Créer un port `EventBus` (interface côté domaine / application).
- Implémenter :
  - `RedisEventBus` (ou `RabbitMQEventBus`) pour la prod
  - `InMemoryEventBus` pour les tests

## Publication & souscription

- `task-service` publie les événements
- `project-service` peut écouter pour gérer la clôture automatique
- `notification-service` écoute tous les événements métier

---

# 5. Notification conditionnelle

## Règle métier

Une notification est déclenchée uniquement si :
actionUserId !== targetUserId

### Cas de notification

- Affectation d’une tâche (`TaskAssigned`)
- Fin de projet (`ProjectClosed`)
- Tâche terminée (`TaskCompleted`)
- Tâche réouverte (`TaskReopened`)

### Exemples

- User A assigne une tâche à User B → notification envoyée
- User A termine une tâche assignée à User B → notification envoyée
- User B termine sa propre tâche → aucune notification

### Localisation de la logique

- La règle conditionnelle doit être dans `notification-service`
- `notification-service` logge les events
- `task-service` publie toujours l’événement sans logique de notification

Principe respecté :

- Responsabilité unique
- Découplage fort
- Séparation métier / comportement transverse

---

# 6. Tests distribués

## Tests unitaires

- Tests des use cases par service
- Tests des règles métier (affectation, clôture)

## Tests d’intégration

- Publication d’événement → réaction attendue

## Test E2E global

Scénario 1 :

1. User A crée projet
2. User B rejoint projet
3. User A assigne tâche à B
4. User A termine la tâche
5. Vérifier notification pour B

Scénario 2 :

1. User B termine sa propre tâche
2. Vérifier absence de notification

---

# 7. Finalisation

- Mise à jour des ADR :
  - Passage monolithe → microservices
  - Introduction Event-Driven
  - Gestion collaborative multi-utilisateurs
- Mise à jour de la documentation :
  - Schéma d’architecture
  - Liste des événements
  - Description des responsabilités par service
- Vérification :
  - Docker Compose démarre tous les services
  - Broker opérationnel
  - Tests passent
  - Communication asynchrone fonctionnelle

---

# Architecture cible

Frontend  
↓  
Services indépendants :

- Project Service
- Task Service
- Notification Service  
  ↓  
  Message Broker  
  ↓  
  Bases de données séparées

---

# Principes respectés

- Responsabilité unique
- Bounded Context (DDD)
- Inversion de dépendance
- Communication asynchrone
- Découplage fort
- Tests adaptés à architecture distribuée

À la fin du projet, ajouter dans la documentation une context map entre entités et aggregate roots, simple mais suffisante pour avoir une représentation globale.
