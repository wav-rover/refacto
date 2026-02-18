# Phase 3 – Introduction de TypeScript

Objectif : introduire TypeScript progressivement dans le projet avec `allowJs` pour permettre une migration progressive. **Aucune modification de structure** ; on renomme les fichiers progressivement et on corrige uniquement les erreurs bloquantes.

Chacun travaille en parallèle sur son périmètre. Branches, commits fréquents.

---

## Prérequis

### Installation de TypeScript

```bash
npm install --save-dev typescript @types/node @types/express
```

### Configuration TypeScript (`tsconfig.json`)

Créer un `tsconfig.json` à la racine avec :

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "noEmit": true
  },
  "include": ["src/**/*", "spec/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Important :** `allowJs: true` permet de garder les fichiers `.js` et `.ts` côte à côte pendant la migration.

---

## Tristan – Migration périmètre « lecture »

**Périmètre :** routes GET et couche de persistance (lecture).

**Fichiers à migrer :**

- `src/routes/getItems.js` → `getItems.ts`
- `src/persistence/index.js` → `index.ts`
- `src/persistence/sqlite.js` → `sqlite.ts`
- `src/persistence/mysql.js` → `mysql.ts`
- `spec/routes/getItems.spec.js` → `getItems.spec.ts`
- `spec/persistence/sqlite.spec.js` → `sqlite.spec.ts`

**À faire :**

1. Renommer les fichiers `.js` en `.ts` un par un.
2. Ajouter des types minimaux pour corriger uniquement les erreurs bloquantes :
   - Types Express (`Request`, `Response`) pour les routes
   - Types pour les paramètres de fonctions async
   - Types pour les objets retournés par la DB
3. Ne pas refactorer : garder la structure existante.
4. Vérifier après chaque migration :
   - `npm run test` (tests Jest)
   - `npm run dev` (démarrage serveur)

**Livrable :** fichiers `.ts` fonctionnels pour le périmètre lecture, tests verts, aucune régression.

---

## Jeremy – Migration périmètre « écriture »

**Périmètre :** routes POST/PUT/DELETE et point d'entrée (écriture).

**Fichiers à migrer :**

- `src/index.js` → `index.ts`
- `src/routes/addItem.js` → `addItem.ts`
- `src/routes/updateItem.js` → `updateItem.ts`
- `src/routes/deleteItem.js` → `deleteItem.ts`
- `spec/routes/addItem.spec.js` → `addItem.spec.ts`
- `spec/routes/updateItem.spec.js` → `updateItem.spec.ts`
- `spec/routes/deleteItem.spec.js` → `deleteItem.spec.ts`

**À faire :**

1. Renommer les fichiers `.js` en `.ts` un par un.
2. Ajouter des types minimaux pour corriger uniquement les erreurs bloquantes :
   - Types Express (`Request`, `Response`) pour les routes
   - Types pour `req.body` et `req.params`
   - Types pour les objets Item (id, name, completed)
   - Types pour les fonctions de callback Express
3. Ne pas refactorer : garder la structure existante.
4. Vérifier après chaque migration :
   - `npm run test` (tests Jest)
   - `npm run dev` (démarrage serveur)

**Livrable :** fichiers `.ts` fonctionnels pour le périmètre écriture, tests verts, aucune régression.

---

## Paul – Migration frontend et configuration

**Périmètre :** application React côté client et fichiers de configuration.

**Fichiers à migrer :**

- `src/static/js/app.js` → `app.tsx` (ou `app.ts` si pas de JSX)
- `jest.config.js` → `jest.config.ts`
- `playwright.config.js` → `playwright.config.ts` (déjà avec `@ts-check`)

**À faire :**

1. Pour `app.js` :
   - Renommer en `.tsx` si utilisation de JSX, sinon `.ts`
   - Ajouter des types pour les composants React
   - Typer les états (`useState`) et les props
   - Typer les réponses API (`fetch`)
2. Pour `jest.config.js` :
   - Renommer en `.ts`
   - Typer l'objet de configuration Jest
3. Pour `playwright.config.js` :
   - Renommer en `.ts` (déjà préparé avec `@ts-check`)
   - Vérifier que la configuration est correctement typée
4. Vérifier après chaque migration :
   - `npm run test` (tests Jest)
   - `npm run test:e2e` (tests Playwright)
   - `npm run dev` (vérifier l'affichage frontend)

**Livrable :** fichiers `.ts`/`.tsx` fonctionnels pour le frontend et la config, tests verts (Jest + E2E), aucune régression visuelle.

---

## Règles communes

### Processus de migration

1. **Un fichier à la fois** : renommer, corriger les erreurs bloquantes uniquement, tester, committer.
2. **Types minimaux** : ajouter uniquement les types nécessaires pour éliminer les erreurs TypeScript. Ne pas sur-typer.
3. **Pas de refactoring** : cette phase est uniquement pour introduire TypeScript, pas pour améliorer le code.
4. **Erreurs bloquantes uniquement** : ignorer les warnings TypeScript non bloquants (on les traitera plus tard).

### Gestion des erreurs

- Si une erreur TypeScript bloque la compilation, ajouter le type minimal nécessaire.
- Si une erreur nécessite un refactoring important, documenter dans un commentaire `// TODO:` et passer au fichier suivant.
- Ne pas utiliser `any` sauf en dernier recours (et documenter pourquoi).

### Vérifications

Après chaque fichier migré :

```bash
# Vérifier la compilation TypeScript
npx tsc --noEmit

# Vérifier les tests
npm test

# Vérifier le démarrage (si fichier backend)
npm run dev
```

### Points de sync (15–20 min)

- Qui a migré quels fichiers
- Erreurs TypeScript rencontrées et solutions trouvées
- Blocages éventuels

---

## Livrables

### Critères de validation

- ✅ Tous les fichiers `.js` du périmètre sont migrés en `.ts`/`.tsx`
- ✅ `npx tsc --noEmit` ne retourne aucune erreur bloquante
- ✅ Tous les tests passent (`npm test` et `npm run test:e2e`)
- ✅ L'application démarre correctement (`npm run dev`)
- ✅ Aucune régression fonctionnelle

### Documentation

Si des types complexes ont été créés ou si des décisions de typage ont été prises, les documenter brièvement dans ce fichier ou dans un fichier `doc/types-decisions.md`.
