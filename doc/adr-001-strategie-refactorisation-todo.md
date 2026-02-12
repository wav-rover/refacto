# ADR 001 – Stratégie de refactorisation de l’application Todo

## Décision

1. **Sécuriser le fonctionnement actuel par les tests** (priorité absolue).
2. **Corriger les failles de sécurité et mettre à jour les dépendances** (backend et frontend).
3. **Introduire TypeScript progressivement** (backend puis frontend), tout en maintenant la couverture de tests.
4. **Mettre en place Docker Compose** pour un environnement de développement et d’exécution reproductible (après sécurisation et migration TypeScript).
5. **Ajouter de nouvelles propriétés métier aux tâches** (statut, priorité, date d’échéance) uniquement après la stabilisation, la migration TypeScript et la mise en place de Docker Compose.

Chaque changement significatif sera documenté dans des ADR et intégré via des commits propres et atomiques.

## Contexte

- L’application Todo repose sur un code legacy instable.
- Les règles métiers doivent être clarifiées et protégées par des tests.
- Les dépendances peuvent être obsolètes ou vulnérables.
- Le passage à TypeScript est souhaité pour renforcer la robustesse, mais impactera la configuration des tests (Jest côté backend, Playwright côté client).

Deux questions guident la refactorisation :

1. Est-ce que l’application fonctionne, et les tests couvrent-ils correctement ses limites ?
2. Est-ce qu’il existe des dépendances obsolètes ou avec des failles de sécurité ?

## Détails de la décision

1. **Renforcer les tests pour figer le comportement actuel**
   - Analyser les règles métiers existantes.
   - Ajouter / compléter les tests unitaires et d’intégration backend (Jest).
   - Ajouter les tests end-to-end côté client (Playwright).
   - Ne pas modifier le comportement métier sans tests existants ou nouvellement ajoutés.

2. **Sécuriser l’application et les dépendances**
   - Auditer les dépendances (backend et frontend) pour détecter les paquets obsolètes ou vulnérables.
   - Mettre à jour ou remplacer les dépendances à risque.
   - Ajouter des tests (ou renforcer ceux existants) pour couvrir les correctifs de sécurité.

3. **Introduire TypeScript**
   - **Backend** :
     - Introduire TypeScript progressivement (fichiers clés en priorité).
     - Adapter la configuration de Jest pour supporter TypeScript (sans retirer Jest).
   - **Frontend** :
     - Passer les composants et la logique métier en TypeScript de façon incrémentale.
     - S’assurer que les tests Playwright restent valides et stables.

4. **Documentation et qualité des commits**
   - Rédiger des ADR pour les décisions structurantes (architecture, choix techniques majeurs).
   - Faire des commits propres, petits, cohérents et orientés sur une seule intention (tests, fix, migration TS, etc.).

5. **Docker Compose**
   - Introduire **après** la sécurisation par les tests, la mise à jour des dépendances et le passage progressif à TypeScript.
   - Définir un ou plusieurs services (backend, frontend, base de données si applicable) dans un `docker-compose.yml`.
   - Permettre de lancer l’ensemble du stack en local avec une commande unique (`docker compose up` ou équivalent).
   - Documenter les commandes et variables d’environnement nécessaires (README ou doc dédiée).
   - S’assurer que les tests peuvent toujours s’exécuter (en local ou dans les conteneurs, selon le choix retenu).

6. **Évolutions métier post-refactorisation : statut, priorité, date d’échéance**
   - Introduire **exclusivement après** :
     - La sécurisation du comportement existant par les tests.
     - La correction des failles de sécurité et la mise à jour des dépendances.
     - Le démarrage de la migration progressive vers TypeScript (backend et frontend).
     - La mise en place de Docker Compose pour un environnement reproductible.
   - Ajouter pour chaque tâche :
     - Un **statut** (par exemple : à faire, en cours, terminé).
     - Une **priorité** (par exemple : basse, normale, haute/critique).
     - Une **date d’échéance**.
   - Encadrer chaque nouvelle propriété par :
     - Des tests (unitaires, intégration et/ou end-to-end) qui fixent le comportement attendu.
   - Aligner le schéma de données (backend, éventuellement base) et le modèle d’affichage (frontend) sur ces nouvelles propriétés.

## Conséquences

- **Positives**
  - Fonctionnement de l’application fiabilisé par les tests.
  - Réduction des failles de sécurité et des risques liés aux dépendances.
  - Code plus robuste et maintenable grâce à TypeScript.
  - Environnement de dev et d’exécution reproductible via Docker Compose (onboarding simplifié, stack identique pour tous).
  - Fonctionnalités métier enrichies pour la gestion des tâches (statut, priorité, date d’échéance), offrant un meilleur suivi opérationnel.
  - Historique Git clair et facile à suivre.

- **Négatives / Risques**
  - Temps initial plus long avant de toucher à la structure profonde du code.
  - Complexité accrue temporairement (coexistence JS/TS, ajustement de Jest).
  - Maintenance supplémentaire liée à Docker (images, dépendances, compatibilité OS).
  - Risque de dérive fonctionnelle si les nouvelles propriétés sont ajoutées trop tôt, sans tests suffisants ni règles métier clairement définies.
  - Nécessité de maintenir la discipline de tests et de documentation tout au long du refactoring.
