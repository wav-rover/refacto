# Phase 5 – Hygiène du projet

Objectif : clarifier et séparer les dépendances, mettre à jour progressivement, puis mettre en place le linting et les règles d’architecture (ESLint, dependency-cruiser) pour interdire certaines dépendances (ex. DB dans le domaine).

Une phase d’hygiène **sans refactoring métier** : on configure les outils et on déplace/met à jour les dépendances.

---

## Prérequis

- **Phase 4 validée** : Node à jour, `npm ci`, `npm test`, `npm run test:e2e` et `npm run dev` OK.
- Environnement stable (voir [phase-4-mise-a-jour-node.md](./phase-4-mise-a-jour-node.md)).

---

## 1. Gestion des dépendances

### 1.1 Séparer dependencies et devDependencies

- **`dependencies`** : uniquement ce qui est nécessaire **à l’exécution** de l’application (runtime).
  - Ex. : `express`, `mysql2`, `sqlite3`, `uuid`, `wait-port`, etc.
- **`devDependencies`** : tout ce qui sert au **développement, aux tests ou au build** (outils).
  - Ex. : `typescript`, `jest`, `@playwright/test`, `esbuild`, `nodemon`, `prettier`, `ts-node`, `@types/*`, etc.

**À faire :**

1. Parcourir chaque entrée de `package.json` et vérifier si le package est utilisé en production ou uniquement en dev/test/build.
2. Déplacer les packages mal classés : `npm uninstall <pkg>` puis `npm install <pkg> --save-dev` (ou `--save` pour runtime).
3. Vérifier après chaque déplacement :
   - `npm ci`
   - `npm test` et `npm run test:e2e`
   - `npm run dev`

**Livrable :** `dependencies` = runtime uniquement ; `devDependencies` = outils uniquement.

### 1.2 Mise à jour progressive des dépendances

- Mettre à jour **une dépendance à la fois** pour limiter les régressions et faciliter le diagnostic.
- Après chaque mise à jour :
  - `npm ci`
  - `npm test` et `npm run test:e2e`
  - `npm run dev`
- En cas de régression ou de breaking change : documenter (ici ou en `// TODO:`), revenir en arrière si besoin, et traiter plus tard.

**Livrable :** dépendances à jour dans la mesure du possible, sans régression ; décisions et blocages documentés.

---

## 2. Linting et règles d’architecture

### 2.1 Configurer ESLint

**À faire :**

1. Installer ESLint et les configs/plugins adaptés au projet (TypeScript, Jest, etc.)

2. Créer ou compléter la configuration ESLint

3. Ajouter un script dans `package.json`
4. Exécuter `npm run lint` et corriger les erreurs bloquantes (ou les désactiver explicitement avec justification documentée).

**Livrable :** ESLint configuré, script `npm run lint` exécutable, pas d’erreurs bloquantes non traitées.

### 2.2 Ajouter dependency-cruiser

**À faire :**

1. Installer dependency-cruiser

2. Initialiser la config (ou créer manuellement)

3. Définir les règles d’architecture dans le fichier de config (ex. `.dependency-cruiser.cjs` ou `dependency-cruiser.js`)

**Livrable :** dependency-cruiser configuré, règles d’architecture documentées, script `npm run lint:deps` exécutable.

### 2.3 Interdire certaines dépendances (ex. DB dans le domaine)

- Dans la config dependency-cruiser, ajouter une règle du type :
  - **Périmètre** : modules du domaine (ex. `src/domain`, ou dossiers sans couche infrastructure).
  - **Interdit** : imports depuis `mysql2`, `sqlite3`, `express`, ou tout module d’infrastructure (DB, HTTP, etc.).
- Documenter la règle dans ce fichier ou dans un fichier dédié (ex. `doc/regles-architecture.md`).

**Livrable :** règle explicite « pas de DB / infra dans le domaine », appliquée par dependency-cruiser et documentée.

---

## Règles communes

- **Pas de refactoring métier** : la phase 5 se limite à l’hygiène des dépendances et à la mise en place du linting / des règles d’architecture. Les refactorings pour respecter ces règles (ex. déplacer du code hors du domaine) peuvent être planifiés en phase 6 ou ultérieurement.
- **Commits atomiques** : un commit par thème (séparation deps, mise à jour d’une dep, config ESLint, config dependency-cruiser, etc.).
- **Une dépendance à la fois** pour les mises à jour ; une règle à la fois pour dependency-cruiser si besoin.

---

## Livrables

### Critères de validation

- `dependencies` ne contient que le nécessaire au runtime ; `devDependencies` contient uniquement les outils.
- Les dépendances ont été mises à jour progressivement ; régressions évitées ou documentées.
- ESLint est configuré ; `npm run lint` s’exécute sans erreur bloquante non justifiée.
- dependency-cruiser est configuré ; `npm run lint:deps` s’exécute.
- Règles d’architecture (ex. pas de DB dans le domaine) sont définies, documentées et appliquées par dependency-cruiser.

### Hors périmètre (ne pas faire en phase 5)

- Refactoring pour déplacer le code afin de respecter les règles d’architecture (phase 6 ou suivante).
- Isolation de l’infrastructure, changement de ports, gros refactoring (phase 6).
