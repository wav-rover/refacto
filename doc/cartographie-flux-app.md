# Cartographie des flux principaux — `src/static/js/app.js`

Ce document décrit les flux de création, modification, suppression et affichage des tâches dans l’application front-end.

---

## 1. Affichage de la liste

| Élément | Détail |
|--------|--------|
| **Composant** | `TodoListCard` (l.14–63) |
| **État** | `items` (`useState(null)`, l.15) |
| **Déclencheur** | Montage du composant |
| **Code** | `useEffect` (l.17–21) : `fetch("/items")` → `r.json()` → `setItems(...)` |
| **API** | `GET /items` |
| **Rendu** | Si `items === null` → "Loading..." (l.45). Sinon formulaire + liste ou message "No items yet!" (l.50–51) ; liste via `items.map` → `<ItemDisplay>` (l.53–60) |

**Enchaînement :** Montage → `GET /items` → `setItems` → affichage liste ou états vides.

---

## 2. Création de tâche

| Élément | Détail |
|--------|--------|
| **Composant** | `AddItemForm` (l.65–109), reçoit `onNewItem` en prop |
| **État local** | `newItem` (saisie), `submitting` (l.68–69) |
| **Déclencheur** | Soumission du formulaire (l.88) |
| **Code** | `submitNewItem` (l.71–85) : `POST /items` avec `{ name: newItem }` → `r.json()` → `onNewItem(item)` puis `setNewItem("")`, `setSubmitting(false)` |
| **API** | `POST /items`, body JSON `{ name: string }` |
| **Remontée** | `onNewItem` dans `TodoListCard` (l.22–27) : `setItems([...items, newItem])` |

**Enchaînement :** Submit formulaire → `POST /items` → réponse item → `onNewItem` → mise à jour de `items` → liste rafraîchie.

---

## 3. Modification de tâche (cocher / décocher)

| Élément | Détail |
|--------|--------|
| **Composant** | `ItemDisplay` (l.111–171), reçoit `item`, `onItemUpdate`, `onItemRemoval` |
| **Déclencheur** | Clic sur le bouton coche (l.141) |
| **Code** | `toggleCompletion` (l.115–126) : `PUT /items/${item.id}` avec `{ name, completed: !item.completed }` → `r.json()` → `onItemUpdate(...)` |
| **API** | `PUT /items/:id`, body JSON `{ name, completed }` |
| **Remontée** | `onItemUpdate` dans `TodoListCard` (l.29–35) : `findIndex` par `item.id` puis `setItems([...slice(0, index), item, ...slice(index + 1)])` |

**Enchaînement :** Clic coche → `PUT /items/:id` → réponse item → `onItemUpdate` → item remplacé dans `items` → liste rafraîchie.

---

## 4. Suppression de tâche

| Élément | Détail |
|--------|--------|
| **Composant** | `ItemDisplay` (même composant que modification) |
| **Déclencheur** | Clic sur le bouton poubelle (l.161) |
| **Code** | `removeItem` (l.128–132) : `DELETE /items/${item.id}` → dans le `.then()`, `onItemRemoval(item)` |
| **API** | `DELETE /items/:id` |
| **Remontée** | `onItemRemoval` dans `TodoListCard` (l.37–43) : `findIndex` par `item.id` puis `setItems([...slice(0, index), ...slice(index + 1)])` |

**Enchaînement :** Clic supprimer → `DELETE /items/:id` → `onItemRemoval(item)` → item retiré de `items` → liste rafraîchie.

---

## Synthèse

| Flux | Déclencheur | Méthode / Route | Callback parent | Effet sur l’état |
|------|-------------|-----------------|-----------------|-------------------|
| Affichage | Montage `TodoListCard` | `GET /items` | — | `setItems` (liste entière) |
| Création | Submit `AddItemForm` | `POST /items` | `onNewItem` | `setItems` (ajout d’un item) |
| Modification | Clic coche `ItemDisplay` | `PUT /items/:id` | `onItemUpdate` | `setItems` (remplacement d’un item) |
| Suppression | Clic poubelle `ItemDisplay` | `DELETE /items/:id` | `onItemRemoval` | `setItems` (retrait d’un item) |

L’état de la liste (`items`) est détenu uniquement dans `TodoListCard` ; les composants enfants déclenchent les appels HTTP et notifient le parent via les callbacks passés en props.
