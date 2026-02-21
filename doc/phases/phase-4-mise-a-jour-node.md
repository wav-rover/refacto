# Phase 4 – Mise à jour de Node

Objectif : mettre à jour la version de Node après stabilisation (phase 3), vérifier les tests et la compatibilité des dépendances, **sans refactorer** en parallèle.

Une seule personne sur cette phase : **Tristan**. Pas de répartition par périmètre applicatif.

---

## Prérequis

- **Phase 3 validée** : tous les tests verts (`npm test`, `npm run test:e2e`), `npx tsc --noEmit` sans erreur bloquante, application fonctionnelle.
- **Versions Node et traçabilité** : documentées dans [phase-4-documentation.md](./phase-4-documentation.md).

---

## Tristan – Mise à jour Node et vérifications

**Périmètre :** mise à jour de Node (environnement local et CI si applicable) et vérifications associées.

**À faire :**

1. **Choisir et documenter la version Node cible**  
   Ex. Node 20 LTS ou version choisie par l’équipe. Figer cette version dans ce document et, si pertinent, dans le README ou la config CI.

2. **Mettre à jour Node**  
   Sur la machine locale (nvm, n, ou installateur officiel) et en CI si le projet en dispose.

3. **Vérifier l’installation des dépendances**

   ```bash
   rm -rf node_modules
   npm ci
   ```

   Succès = pas d’erreur, `node_modules` recréé.

4. **Vérifier les tests**

   ```bash
   npm test
   npm run test:e2e
   ```

   Succès = tous les specs Jest et tous les tests Playwright passent.

5. **Vérifier le démarrage de l’application**

   ```bash
   npm run dev
   ```

   S’assurer que l’app démarre et que le comportement de base est intact.

6. **Compatibilité des dépendances**  
   Pas d’erreur à l’install, pas de warning bloquant. Si une dépendance pose problème avec la nouvelle version de Node, documenter ici (ou en `// TODO:` dans le code) **sans** mettre à jour les dépendances dans cette phase, sauf si strictement nécessaire pour faire tourner l’app sous la nouvelle version de Node.

**Livrable :** version Node cible documentée, environnement à jour, tous les tests verts, aucune régression fonctionnelle.

---

## Règles communes

- **Aucun refactoring** : cette phase se limite à la mise à jour de Node et aux vérifications ci-dessus. Pas de changement de code métier, pas de restructuration, pas de nouvelle dépendance ni de migration d’outillage.
- **Commits atomiques** : par exemple un commit pour la documentation / version Node cible, puis un (ou des) commit(s) pour les éventuels ajustements de config ou de CI liés à la mise à jour.

---

## Livrables

### Critères de validation

- Version de Node cible documentée (dans ce fichier ou README / CI).
- `npm ci` s’exécute sans erreur après mise à jour.
- `npm test` et `npm run test:e2e` passent.
- `npm run dev` permet de démarrer l’application sans régression.
- Aucune régression fonctionnelle.

### Hors périmètre (ne pas faire en phase 4)

- Mise à jour des dépendances npm (hygiène des deps = phase 5).
- Linting, ESLint, dependency-cruiser (phase 5).
- Isolation de l’infrastructure, ports, refactoring (phase 6).
