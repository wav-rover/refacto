# Règles d'architecture

Ce document décrit les règles d'architecture appliquées par dependency-cruiser.

---

## Règle : pas de DB / infra dans le domaine

### Périmètre

Les modules du **domaine**, c'est-à-dire les modules sous `src/domain`.

### Interdit

Les modules du domaine ne doivent **pas** importer :

- **mysql2**, **sqlite3** : drivers de base de données
- **express** : serveur HTTP
- **wait-port** : utilitaire d'infrastructure (attente de port)
- Ou tout autre module d'infrastructure (DB, HTTP, etc.)

La liste exacte est définie dans `.dependency-cruiser.js` (règle `no-db-or-infra-in-domain`) et peut être étendue si nécessaire (ex. autres drivers DB).

### Objectif

Le domaine doit rester **pur** et ne pas dépendre directement des couches d'infrastructure. Cela permet une meilleure testabilité et une séparation claire des responsabilités.

### Application

- La règle est appliquée par **dependency-cruiser** via le script `npm run lint:deps`.
- En phase 5, aucun refactoring métier n'est réalisé. Si le dossier `src/domain` n'existe pas encore, la règle ne s'applique à aucun fichier et est prête pour la phase 6.
