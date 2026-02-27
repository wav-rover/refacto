## Règles métier – `auth-service` / `user-service`

Ce document détaille les règles principales liées aux utilisateurs et à l’authentification.

### Objectif

- Fournir un `userId` et un contexte d’identité fiables à l’ensemble des services.
- Gérer le cycle de vie des comptes utilisateurs (création, authentification, éventuellement suppression/désactivation).
- Porter uniquement la logique d’identité et de sécurité transverses, pas la logique métier de projet/tâche.

### Modèle utilisateur (vue d’ensemble)

- Champs typiques :
  - `id`
  - `email` (unique)
  - `passwordHash`
  - `createdAt`
  - `updatedAt`
- Des métadonnées supplémentaires peuvent exister (nom, prénom, avatar, etc.) mais n’affectent pas la logique métier des autres services.

### Création d’utilisateur

- Opération `register` :
  - valide la forme de l’email et sa disponibilité ;
  - applique des règles de complexité de mot de passe ;
  - stocke uniquement un hash sécurisé (jamais le mot de passe en clair).

### Authentification

- Opération `login` :
  - vérifie les identifiants (email + mot de passe) ;
  - génère un jeton d’accès (JWT ou autre) contenant au minimum :
    - `userId`
    - dates d’émission/expiration ;
- L’API protège les routes sensibles des autres services via une couche d’authentification commune
  (gateway, middleware, etc.) qui extrait le `userId` du jeton.

### Déconnexion (logout)

- pour un JWT purement stateless, la déconnexion côté client consiste surtout à supprimer le jeton ;

### Édition de profil

- Opération `editUser` :
  - permet de modifier les données de profil non sensibles (nom, avatar, etc.) ;
- Les changements effectués dans `user-service` n’ont pas d’impact direct sur les projets/tâches, qui ne dépendent que de `userId`.

### Rôle vis-à-vis des autres services

- Le `auth-service` :
  - ne connaît pas les notions de projet, tâche ou notification ;
  - fournit uniquement l’identité et, éventuellement, des rôles/permissions globales (ex. administrateur système).
- La gestion des rôles spécifiques (chef de projet, membre de projet, etc.) est portée par les services métiers
  (`project-service`, `task-service`) en se basant sur le `userId`.
