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
