# Phase 7 – Statut, priorité, date d'échéance, puis auth

Objectif : ajouter le **statut** et la **priorité** de la tâche, une **date d'échéance**, puis en dernier une **authentification minimale**. Code minimal, propre et fonctionnel — pas de sur-ingénierie.

Prérequis : **phase 6 terminée** et validée (tous les tests verts, wiring + injection repo en place).

---

## Prérequis

- **Phase 6 terminée** et validée : tous les tests (Jest + E2E) verts, wiring index + injection repo en place.
- Vérifications avant de démarrer : `npm test`, `npm run test:e2e`, `npm run dev`.

---

## Périmètre fonctionnel

1. **Statut de la tâche** : valeur parmi un petit ensemble (ex. `todo` | `in_progress` | `done`).
2. **Priorité** : valeur parmi un petit ensemble (ex. `low` | `medium` | `high`).
3. **Date d'échéance** : date optionnelle (chaîne ISO ou `null`).
4. **Auth** (en dernier) : authentification minimale puis protection des routes et de l'UI.
 
---

## Modèle de données (à aligner partout)

- **Item** étendu avec :
  - `status` : `"todo"` | `"in_progress"` | `"done"` (défaut `"todo"`).
  - `priority` : `"low"` | `"medium"` | `"high"` (défaut `"medium"`).
  - `dueDate` : `string | null` (ISO date, ex. `"2025-12-31"`), défaut `null`.
- Les champs existants `id`, `name`, `completed` sont conservés.

---

## Tristan – Port et persistance

**Périmètre :** `src/ports/itemRepository.ts`, `src/persistence/sqlite.ts`, `src/persistence/inMemory.ts`, `spec/persistence/repository.spec.ts`. MySQL hors scope phase 7 (documenter seulement si besoin).

**À faire (dans l'ordre) :**

1. **Port**  
   Dans `src/ports/itemRepository.ts` : étendre l'interface `Item` avec `status`, `priority`, `dueDate` (types ci-dessus). Adapter la signature de `updateItem` pour accepter un objet partiel incluant ces champs (ex. `{ name?: string; completed?: boolean; status?: Item["status"]; priority?: Item["priority"]; dueDate?: string | null }`).

2. **SQLite**  
   Dans `src/persistence/sqlite.ts` :
   - Ajouter les colonnes à la table (migration minimale : `ALTER TABLE` ou recréation documentée si préféré). Colonnes : `status`, `priority`, `dueDate` (types adaptés : varchar / date).
   - Adapter `ItemRow`, `getItems`, `getItem`, `storeItem`, `updateItem` pour lire/écrire ces champs. Valeurs par défaut en lecture si colonne absente (rétrocompat) ou migration unique au démarrage.

3. **InMemory**  
   Dans `src/persistence/inMemory.ts` : le type `Item` du port inclut déjà les nouveaux champs ; s'assurer que `storeItem` / `updateItem` gèrent `status`, `priority`, `dueDate` (pas de changement structurel si on stocke l'objet tel quel).

4. **Spec persistance**  
   Dans `spec/persistence/repository.spec.ts` : étendre les données de test (ITEM avec `status`, `priority`, `dueDate`) et ajouter un test minimal qui vérifie lecture/écriture de ces champs (ex. update status + dueDate puis getItem).

**Livrable :** Item étendu dans le port, SQLite et InMemory cohérents, spec persistance vert avec nouveaux champs.

---

## Jeremy – Routes et auth backend

**Périmètre :** `src/index.ts`, routes addItem / updateItem (getItems si tri/filtre côté API — optionnel, à garder minimal), route login et middleware d'auth.

**À faire (partie « champs métier », avant auth) :**

1. **addItem**  
   Accepter dans le body : `name` (obligatoire), `status?`, `priority?`, `dueDate?`. Appliquer des valeurs par défaut : `status = "todo"`, `priority = "medium"`, `dueDate = null`. Construire l'objet `Item` complet et appeler `repo.storeItem(item)`.

2. **updateItem**  
   Accepter dans le body : `name?`, `completed?`, `status?`, `priority?`, `dueDate?`. Ne mettre à jour que les champs envoyés (merge avec l'item existant). Appeler `repo.updateItem(id, ...)` avec une signature étendue (alignée sur le port).

3. **Specs routes**  
   Adapter les specs addItem et updateItem : mocker le repo avec des `Item` complets (incluant status, priority, dueDate), et vérifier les appels et réponses avec ces champs.

**À faire (partie « auth », en dernier) :**

4. **Auth minimale**
   - Une route `POST /login` (ou équivalent) qui reçoit identifiant/mot de passe (ex. body `{ username, password }`), vérifie contre une config (env ou utilisateur unique en dur pour le minimal), et crée une session (cookie) ou renvoie un JWT.
   - Un middleware qui protège les routes `/items` (GET, POST, PUT, DELETE) : si non authentifié, renvoyer 401.
   - Ne pas compliquer : pas d'inscription, pas de rôles, pas de refresh token dans un premier temps.

5. **Documentation**  
   Documenter dans ce fichier comment configurer les identifiants (env vars) et comment appeler le login (ex. depuis le front ou curl).

**Livrable :** Routes addItem/updateItem avec statut, priorité, date d'échéance ; specs verts ; puis auth (login + protection) et doc.

---

## Paul – Frontend et E2E, puis auth frontend

**Périmètre :** `src/frontend/app.tsx`, tests E2E Playwright.

**À faire (partie « champs métier », avant auth) :**

1. **Type Item**  
   Aligner l'interface `Item` du frontend avec le port (id, name, completed, status, priority, dueDate).

2. **Formulaire d'ajout**  
   Permettre de saisir (optionnel) : statut, priorité, date d'échéance. Envoi dans le body du `POST /items` avec les valeurs choisies ou défauts.

3. **Affichage / édition d'une tâche**  
   Afficher pour chaque tâche : statut, priorité, date d'échéance. Permettre de les modifier (ex. champs éditables ou sélecteurs) et envoyer un `PUT /items/:id` avec les champs mis à jour (en plus de name/completed si déjà présents).

4. **E2E**  
   Adapter les scénarios E2E existants pour prendre en compte les nouveaux champs (ex. créer une tâche avec priorité, vérifier l'affichage ; modifier la date d'échéance). Rester minimal.

**À faire (partie « auth », en dernier) :**

5. **Auth frontend**
   - Page (ou formulaire) de login : saisie identifiant/mot de passe, appel à `POST /login`, puis redirection ou mise à jour de l'état « connecté ».
   - Envoi des requêtes vers l'API avec les credentials (cookie automatique si session cookie, ou header Authorization si JWT).
   - Gestion du 401 : redirection vers la page de login ou affichage d'un message.
   - Logout : invalider la session / supprimer le token et revenir à l'écran de login.

**Livrable :** UI et E2E pour statut, priorité, date d'échéance ; puis login/logout et appels API authentifiés.

---

## Ordre recommandé et points de sync

1. **Tristan** : port + SQLite + InMemory + spec persistance (ordre ci-dessus).
2. **Jeremy** : addItem/updateItem (body + défauts) + specs routes, une fois le port étendu.
3. **Paul** : type Item frontend + formulaire + affichage/édition + E2E, en parallèle ou après les routes.
4. **Sync** : partager la forme exacte de `Item` et des enums (status, priority) pour éviter écarts API / frontend.
5. **Auth** : après que tout soit vert (champs métier). Jeremy met en place login + middleware ; Paul met en place login UI + logout + gestion 401.

---

## Règles communes

- Code **minimal, propre et fonctionnel** — pas de sur-ingénierie.
- Commits atomiques par thème (port, sqlite, routes, frontend, auth).
- Vérifier après chaque étape : `npm test`, `npm run test:e2e`, `npm run dev`.

---

## Livrables phase 7

- Item étendu avec `status`, `priority`, `dueDate` ; port et persistance à jour.
- Routes addItem et updateItem qui acceptent et renvoient ces champs ; specs verts.
- Frontend : ajout/édition/affichage statut, priorité, date d'échéance ; E2E à jour.
- Auth : login (backend + frontend), protection des routes `/items`, logout ; doc de config.
- Tous les tests (Jest + E2E) verts ; code minimal et fonctionnel.

---

## Hors périmètre (rester minimal)

- Pas de gestion d'utilisateurs multiples (comptes, inscription) sauf si décision explicite.
- Pas de rôles ni permissions fines.
- MySQL : pas obligatoire de migrer les colonnes en phase 7 si non utilisé ; documenter si besoin.
- Pas de refactoring hors ajout des champs et de l'auth.
