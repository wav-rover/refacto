# Contrats des routes API (phase 1)

Comportement figé par les tests Jest. À mettre à jour quand une route passe en vert.

---

## POST /items (addItem)

**Body attendu :** `{ "name": "<string>" }` (JSON).

| Cas | Statut HTTP | Réponse |
|-----|-------------|---------|
| Nom valide (non vide, après trim) | 200 | `{ "id": "<uuid>", "name": "<trimmed>", "completed": false }` |
| Body sans `name` | 400 | `{ "error": "Name is required" }` |
| `name` vide `""` | 400 | `{ "error": "Name is required" }` |
| `name` uniquement espaces | 400 | `{ "error": "Name is required" }` |

**Spec :** `spec/routes/addItem.spec.js`

---

## PUT /items/:id (updateItem)

**Body attendu :** `{ "name": "<string>", "completed": <boolean> }` (JSON). `completed` est optionnel (défaut : `false`).

| Cas | Statut HTTP | Réponse |
|-----|-------------|---------|
| Body valide, item existant | 200 | Item mis à jour `{ "id", "name", "completed" }` |
| Body sans `name` ou `name` invalide (vide / espaces) | 400 | `{ "error": "Name is required" }` |
| Item inexistant (id inconnu) | 404 | `{ "error": "Item not found" }` |

**Spec :** `spec/routes/updateItem.spec.js`

---

## DELETE /items/:id (deleteItem)

Pas de body.

| Cas | Statut HTTP | Réponse |
|-----|-------------|---------|
| Item existant | 200 | Pas de body |
| Item inexistant (id inconnu) | 404 | `{ "error": "Item not found" }` |

**Spec :** `spec/routes/deleteItem.spec.js`
