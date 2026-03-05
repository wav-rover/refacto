# Modèle User – auth-service (Step 1)

Ce service gère les utilisateurs de façon dédiée (séparée du monolithe).

## Contraintes

- `id` :
  - identifiant opaque (`string`), généré côté service (UUID dans l'étape suivante).
- `email` :
  - non nul, unique dans la table `users`.
- `passwordHash` :
  - hash du mot de passe utilisateur (algorithme à préciser dans l'étape suivante – initialement aligné sur le monolithe).
- `createdAt` :
  - date de création au format ISO 8601 (`new Date().toISOString()`).

Ce contrat est interne à `auth-service` mais doit rester **stable** pour faciliter :

- l'implémentation ultérieure de `register` / `login` / `me` ;
- la migration progressive de l'authentification du monolithe vers `auth-service`.
