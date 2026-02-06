# Phase 1 – Répartition des tâches (tests)

Objectif de la phase 1 (ADR 001) : figer le comportement actuel de l’application par des tests (backend Jest + E2E) pour pouvoir refactoriser en sécurité.

Chacun travaille en parallèle sur son périmètre. Branches , commits fréquents.

---

## Tristan – Tests backend « lecture »

**Périmètre :** route GET des items.

**À faire :**

- Analyser le comportement actuel de `GET /items` (`src/routes/getItems.js`).
- Compléter / renforcer `spec/routes/getItems.spec.js`.
- Couvrir : liste vide, cas nominal, format de réponse, codes HTTP, erreurs éventuelles.

**Livrable :** specs Jest vertes pour `getItems`, comportement documenté (structure JSON, statuts).

---

## Jeremy – Tests backend « écriture »

**Périmètre :** routes POST, PUT, DELETE des items.

**À faire :**

- Analyser le comportement actuel de :
  - `POST /items` (`src/routes/addItem.js`)
  - `PUT /items/:id` (`src/routes/updateItem.js`)
  - `DELETE /items/:id` (`src/routes/deleteItem.js`)
- Compléter / renforcer :
  - `spec/routes/addItem.spec.js`
  - `spec/routes/updateItem.spec.js`
  - `spec/routes/deleteItem.spec.js`
- Couvrir : validations, body manquant ou invalide, item inexistant (PUT/DELETE), cas nominal.

**Livrable :** specs Jest vertes pour add / update / delete, comportement documenté.

---

## Paul – Tests E2E / comportement global

**Périmètre :** scénarios end-to-end côté client.

**À faire :**

- Cartographier les flux principaux dans `src/static/js/app.js` (création, modification, suppression de tâche, affichage de la liste).
- Mettre en place les tests E2E (Playwright) pour :
  - Créer une tâche et la voir dans la liste.
  - Modifier une tâche.
  - Supprimer une tâche.
- S’assurer que le comportement observé en E2E est cohérent avec ce que Tristan et Jeremy ont figé côté API.

**Livrable :** scénarios E2E verts pour les flux principaux ; pas de blocage si les specs backend ne sont pas toutes finies (avancer sur les flux déjà couverts).

---

## Règles communes

- **Contrat par route :** quand une route a des tests verts, noter brièvement statut HTTP, structure JSON et cas d’erreur (pour Paul et les merges).
- **Points de sync (15–20 min) :** qui a figé quelles routes ; Paul adapte les E2E en fonction.
