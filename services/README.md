# Services (mono-repository)

Arborescence des services de l’architecture phase 2. Chaque service est isolé : son propre `package.json`, son propre `Dockerfile`, aucune dépendance directe vers un autre service.

## Arborescence cible

À terme, sous `services/` :

- `project-service/` — gestion des projets et des membres
- `task-service/` — gestion des tâches et affectations
- `notification-service/` — écoute des événements et notifications
- `auth-service/` — authentification et utilisateurs

**État actuel :** les quatre services sont en place (`project-service`, `task-service`, `notification-service`, `auth-service`).

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

## notification-service

Service squelette (sans logique métier) : démarre et répond sur `GET /`.

### Lancer en local

```bash
cd services/notification-service
npm install
npm run build
npm start
```

Le port est configuré via la variable d'environnement `PORT` (fichier `.env` ou `.env.example`). Par défaut : **3003**. Pour surcharger : `PORT=3006 npm start`.

### Développement

```bash
npm run dev
```

### Build Docker

Le `.env` n'est pas copié dans l'image (voir `.dockerignore`), donc le port par défaut du code (**3003**) est utilisé. Aucun `-e PORT` nécessaire.

```bash
docker build -t notification-service ./services/notification-service
docker run -p 3003:3003 notification-service
```

Puis ouvrir http://localhost:3003/

## auth-service

Service squelette (sans logique métier) : démarre et répond sur `GET /`. L’authentification (register, login, me) sera implémentée dans la phase 2 (tâche Jeremy – Service d’authentification).

### Lancer en local

```bash
cd services/auth-service
npm install
npm run build
npm start
```

Le port est configuré via la variable d'environnement `PORT` (fichier `.env` ou `.env.example`). Par défaut : **3004**. Pour surcharger : `PORT=3007 npm start`.

### Développement

```bash
npm run dev
```

### Build Docker

Le `.env` n'est pas copié dans l'image (voir `.dockerignore`), donc le port par défaut du code (**3004**) est utilisé. Aucun `-e PORT` nécessaire.

```bash
docker build -t auth-service ./services/auth-service
docker run -p 3004:3004 auth-service
```

Puis ouvrir http://localhost:3004/

---

Pour lancer les quatre services en parallèle : `docker run -p 3001:3001 project-service`, `docker run -p 3002:3002 task-service`, `docker run -p 3003:3003 notification-service` et `docker run -p 3004:3004 auth-service`.
