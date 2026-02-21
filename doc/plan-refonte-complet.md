# Plan de refonte complet

**Où on en est :** Phase 5 terminée (hygiène du projet). Prêt pour la phase 6

---

## 1. Sécurisation par les tests

- Tests E2E (frontend) :
  - Installer et configurer Playwright
  - Tester les parcours utilisateurs clés
- Tests backend existants (Jest) :
  - Configurer Jest (déjà présent)
  - Exécuter les tests existants
- Gestion de la base de données en tests :
  - Séparer les tests de persistance des tests des routes

## 2. Fiabilisation de l'environnement

- Génération du lockfile
- Vérifier :
  - installation
  - exécution des tests
  - versions critiques

## 3. Introduction de TypeScript

- Ajouter TypeScript (avec « allowJs »)
- Aucune modification de structure
- Renommer les fichiers progressivement
- Corriger uniquement les erreurs bloquantes !

## 4. Mise à jour de Node

- Mettre à jour Node après stabilisation
- Vérifier :
  - tests
  - compatibilité des dépendances
- Ne rien refactorer en même temps !

## 5. Hygiène du projet

→ **Documentation détaillée :** [phase-5-hygiene-projet.md](./phase-5-hygiene-projet.md)

- Gestion des dépendances :
  - Séparer :
    - « dependencies » → runtime
    - « devDependencies » → outils
  - Mettre à jour progressivement (une dépendance à la fois)
- Linting & règles d'architecture :
  - Configurer ESLint
  - Ajouter « dependency-cruiser »
  - Interdire certaines dépendances (ex: DB dans le domaine)

## 6. Isolation de l'infrastructure

- Créer des interfaces (ports) :
  - SqliteRepository
  - InMemoryRepository
- Injecter l'implémentation selon l'environnement
- Test de non-régression structurelle :
  - Ajouter un test interdisant sqlite3 en test
  - Bloquer toute régression future
