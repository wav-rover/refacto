# Services (mono-repository)

Arborescence des services de l’architecture phase 2. Chaque service est isolé : son propre `package.json`, son propre `Dockerfile`, aucune dépendance directe vers un autre service.

## Arborescence cible

À terme, sous `services/` :

- `project-service/` — gestion des projets et des membres
- `task-service/` — gestion des tâches et affectations
- `notification-service/` — écoute des événements et notifications
- `auth-service/` — authentification et utilisateurs

**État actuel :** `project-service` et `task-service` sont en place. Les deux autres services seront ajoutés plus tard sur le même modèle.

## Règle d’isolation

**Aucun import inter-service.** Chaque service ne doit dépendre que de ses propres sources et de son `node_modules`. Interdit : `import ... from '../../task-service'` ou tout chemin vers un autre dossier service.

Cette règle sera vérifiable par dependency-cruiser ou lint lorsque les autres services existeront.

Référence : [Phase 2 – Cœur technique](../doc/phases/refacto-2-archi/phase-2-archi-coeur-technique-repartition-taches.md), [Plan de refonte architecture](../doc/plan-refonte-architecture.md).

## project-service

Service squelette (sans logique métier) : démarre et répond sur `GET /`.

### Lancer en local

```bash
cd services/project-service
npm install
npm run build
npm start
```

Le port est configuré via la variable d’environnement `PORT` (fichier `.env` ou `.env.example`). Par défaut : **3001**. Pour surcharger : `PORT=3005 npm start`.

### Développement

```bash
npm run dev
```

### Build Docker

Le `.env` n’est pas copié dans l’image (voir `.dockerignore`), donc le port par défaut du code (**3001**) est utilisé. Aucun `-e PORT` nécessaire.

```bash
docker build -t project-service ./services/project-service
docker run -p 3001:3001 project-service
```

Puis ouvrir http://localhost:3001/

## task-service

Service squelette (sans logique métier) : démarre et répond sur `GET /`.

### Lancer en local

```bash
cd services/task-service
npm install
npm run build
npm start
```

Le port est configuré via la variable d’environnement `PORT` (fichier `.env` ou `.env.example`). Par défaut : **3002**. Pour surcharger : `PORT=3006 npm start`.

### Développement

```bash
npm run dev
```

### Build Docker

Le `.env` n’est pas copié dans l’image (voir `.dockerignore`), donc le port par défaut du code (**3002**) est utilisé. Aucun `-e PORT` nécessaire.

```bash
docker build -t task-service ./services/task-service
docker run -p 3002:3002 task-service
```

Puis ouvrir http://localhost:3002/

---

Pour lancer les deux services en parallèle : `docker run -p 3001:3001 project-service` et `docker run -p 3002:3002 task-service`.
