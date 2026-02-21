# Phase 6 – Isolation de l'infrastructure

Objectif : créer des ports (interfaces) pour la persistance, deux implémentations (SqliteRepository, InMemoryRepository), injecter l'implémentation selon l'environnement, et ajouter un test de non-régression pour interdire sqlite3 en test.

Référence : section « 6. Isolation de l'infrastructure » du [plan de refonte](./plan-refonte-complet.md). Ne faire que ce qui est dans cette section ; pas de refactoring métier au-delà.

Chacun travaille sur son périmètre. Ordre recommandé : Tristan → Jeremy → Paul (Paul peut être en parallèle de Jeremy une fois l'interface figée).

---

## Prérequis

- **Phase 5 validée** : ESLint, dependency-cruiser, dépendances séparées (dependencies / devDependencies). Fichiers en place : `eslint.config.js`, `.dependency-cruiser.js`, `doc/architecture/regles-architecture.md` ; scripts : `npm run lint`, `npm run lint:deps`.
- **Vérification obligatoire avant démarrage** (tout doit passer) :
  - `npm run lint`
  - `npm run lint:deps`
  - `npm test`
  - `npm run test:e2e`
  - `npm run dev`

---

## Tristan – Port et implémentations (lecture + persistance)

**Périmètre :** interface du repository, implémentations Sqlite et InMemory, module persistance, route getItems et son spec.

**À faire (dans l'ordre) :**

1. **Définir le port (interface)**  
   Créer une interface (ex. `ItemRepository` ou `TodoRepository`) avec les méthodes utilisées par les routes : `init`, `teardown`, `getItems`, `getItem`, `storeItem`, `updateItem`, `removeItem`.  
   Fichier dédié recommandé : `src/ports/itemRepository.ts` ou `src/persistence/types.ts`.  
   Centraliser le type `Item` (id, name, completed) dans ce fichier ou un type partagé.

2. **Implémentation SqliteRepository**  
   Adapter `src/persistence/sqlite.ts` pour exposer un objet qui implémente cette interface. Conserver le comportement actuel ; seule la signature exportée doit respecter le port.

3. **Implémentation InMemoryRepository**  
   Créer un nouveau fichier (ex. `src/persistence/inMemory.ts`) : implémentation en mémoire (tableau, map) pour les tests, même interface que le port.

4. **Module persistance et choix d'implémentation**  
   Adapter `src/persistence/index.ts` pour exporter une factory (ex. `getRepository(env)` ou `createRepository()`) qui retourne selon l'environnement : `NODE_ENV === 'test'` → InMemoryRepository, sinon SqliteRepository (ou MySQL si déjà géré). Documenter le cas MySQL si hors scope phase 6.

5. **Route getItems**  
   Refactorer `src/routes/getItems.ts` pour recevoir le repository en injection au lieu de `require("../persistence")`. Exporter une fonction du type `(repo) => (req, res) => ...` (ou équivalent).

6. **Spec getItems**  
   Adapter `spec/routes/getItems.spec.ts` pour injecter un mock du repository au lieu de mocker le module persistence.

7. **Spec persistance**  
   Remplacer ou adapter `spec/persistence/sqlite.spec.ts` pour tester le contrat du repository via **InMemoryRepository** uniquement (plus d'import de `sqlite3` dans `spec/`). Si un test d'intégration Sqlite doit être conservé, le documenter (ex. job CI séparé) sans importer sqlite3 dans les specs unitaires.

**Livrable :** port défini, SqliteRepository et InMemoryRepository implémentés, factory dans persistence/index, getItems injecté, specs getItems et persistance verts sans sqlite3.

---

## Jeremy – Wiring et routes d'écriture

**Périmètre :** `src/index.ts`, routes addItem, updateItem, deleteItem et leurs specs.

**À faire (après que Tristan ait exposé le port et la factory) :**

1. **Wiring dans index**  
   Dans `src/index.ts` : appeler la factory (ex. `getRepository()` / `createRepository()`) pour obtenir une instance du repository, appeler `repo.init()`, puis enregistrer les routes en passant cette instance (ex. `app.get("/items", getItems(repo))` si getItems est une fonction qui prend le repo et retourne le handler).

2. **Routes addItem, updateItem, deleteItem**  
   Refactorer `src/routes/addItem.ts`, `src/routes/updateItem.ts`, `src/routes/deleteItem.ts` pour recevoir le repository en injection (même pattern que getItems) au lieu de `require("../persistence")`.

3. **Specs des routes d'écriture**  
   Adapter les specs addItem, updateItem, deleteItem pour injecter un mock du repository au lieu de mocker le module persistence.

**Livrable :** application démarrant avec un repository injecté (InMemory en test, Sqlite en dev/prod), routes d'écriture et leurs specs verts.

---

## Paul – Test de non-régression structurelle

**Périmètre :** garantir qu'aucun test (spec) n'utilise sqlite3.

**À faire :**

1. **Règle ou test explicite**  
   Choisir une des options (ou les deux) et la documenter dans ce fichier :
   - **Option A** : Ajouter une règle dans le fichier **`.dependency-cruiser.js`** (déjà en place en phase 5) : les fichiers sous `spec/` ne doivent pas dépendre de `sqlite3` ni de `src/persistence/sqlite`. Cibler `from: { path: "^spec/" }` et interdire les chemins vers `node_modules/sqlite3` et `src/persistence/sqlite`.
   - **Option B** : Test Jest qui échoue si du code chargé en `NODE_ENV=test` requiert `sqlite3` (ex. vérifier qu'aucun module sous spec n'importe sqlite3).

2. **Documentation**  
   Indiquer ici comment la règle ou le test est exécuté : **`npm run lint:deps`** (déjà défini en phase 5) pour l'option A, ou un script dédié pour l'option B. Toute régression (réintroduction de sqlite3 en test) doit rester bloquée. Mettre à jour `doc/architecture/regles-architecture.md` si une nouvelle règle dependency-cruiser est ajoutée.

**Livrable :** test ou règle appliqué, documenté, et exécutable en CI.

---

## Règles communes

- **Rester dans le périmètre** : pas de refactoring métier au-delà de l'injection du repository et du test structurel.
- **Ordre recommandé** : Tristan (port + implémentations + getItems + specs persistance/getItems) → Jeremy (index + routes écriture + leurs specs) → Paul (test structurel, en parallèle possible avec Jeremy).
- **Points de sync** : après mise en place du port et de la factory (Tristan), partager la signature et le nom de la factory avec Jeremy ; après wiring (Jeremy), vérifier que `npm test` et `npm run test:e2e` sont verts.
- **Commits atomiques** : un commit par thème (port, implémentation, factory, route, spec, règle structurelle).

---

## Livrables

### Critères de validation

- Interface (port) du repository définie et utilisée par les deux implémentations.
- SqliteRepository et InMemoryRepository implémentés ; en test, seule l'InMemory est utilisée.
- Index (ou bootstrap) injecte le repository dans les routes ; plus de `require("../persistence")` dans les handlers de routes.
- Test ou règle interdisant sqlite3 en test ; documenté et exécutable.
- Tous les tests (Jest + E2E) verts, aucune régression.

### Hors périmètre (ne pas faire en phase 6)

- Refactoring métier au-delà de l'injection du repository.
- Changement de structure des routes (ex. controllers, services) non nécessaire à l'injection.
- Modifications frontend ou E2E hors adaptation éventuelle des mocks/env.
