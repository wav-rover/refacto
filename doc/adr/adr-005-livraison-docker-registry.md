# ADR 005 – Livraison des images Docker et registry (CD)

- **Statut** : Accepté
- **Date** : 2026-05-21
- **Décideurs** : Tristan, Jeremy, Paul
- **Contexte** : Chaque service possède un `Dockerfile` (build multi-stage `node-alpine`) et le frontend un `Dockerfile.frontend`. Il n'existe aujourd'hui aucune chaîne de **livraison** : les images ne sont ni construites, ni scannées, ni publiées par la CI. Il faut décider où publier les images, pour quelle(s) plateforme(s), avec quelles garanties de sécurité et de reproductibilité. La stratégie d'intégration continue est traitée dans **[ADR 004](./adr-004-strategie-integration-continue.md)**.

## Options

### Registry cible
| Critère | GitHub Container Registry (GHCR) | Docker Hub |
|---|---|---|
| **Intégration** | Native au repo GitHub, auth via `GITHUB_TOKEN`. | Externe, nécessite des secrets (login + token). |
| **Privé** | Gratuit, lié aux droits du repo. | Possible mais quotas plus limités. |
| **Gestion des secrets** | Aucune (token fourni par Actions). | Secrets à créer et maintenir. |

### Plateforme(s) de build
- **amd64 seul** : build rapide, suffisant pour le déploiement et la correction du projet.
- **amd64 + arm64** : multi-arch, mais double le temps de build (émulation QEMU pour arm64).

## Décision

- **Registry : GHCR** (`ghcr.io/<owner>/<service>`), authentification via `GITHUB_TOKEN`. Zéro secret externe à gérer, droits alignés sur le repo.
- **Plateforme : `linux/amd64` uniquement**. Buildx est conservé (cache, build avancé) mais sur une seule plateforme ; le multi-arch pourra être ajouté plus tard si un besoin de déploiement ARM apparaît.

### Workflow de publication

**`publish.yml` — Publication Docker** *(sur `main`, après le workflow Qualité & sécurité vert)*
- Déclenché via `workflow_run` (succès de `main-quality.yml`) : **on ne publie jamais une image non validée**.
- `docker/setup-buildx-action` → build `linux/amd64` des services concernés.
- **Trivy** scanne chaque image et **échoue sur HIGH/CRITICAL**.
- Push vers **GHCR**.
- Tags : `latest`, `sha` court, et tag de version sur release.
- Cache des layers via `type=gha`.

### Reproductibilité des images (décisions liées)
- **`npm ci`** dans tous les Dockerfiles (au lieu de `npm install`) : respect strict du lockfile.
- **Alignement Node 24** : les Dockerfiles passent de `node:20-alpine` à `node:24-alpine`, cohérent avec `.nvmrc` (`24.13.1`) et la version testée en CI. On évite de tester sur une version et de livrer sur une autre.
- **Contexte de build racine** : avec le lockfile unique décidé en **[ADR 006](./adr-006-npm-vs-pnpm.md)**, le build d'image se fait en contexte racine (`context: .`) — chaque Dockerfile copie le `package-lock.json` racine + les `package.json` du workspace avant `npm ci`. C'est la condition pour que `npm ci` fonctionne sans lockfile par service.

## Conséquences

### Positives
- Publication automatique, tracée et sécurisée (scan bloquant) uniquement d'images déjà validées.
- Aucun secret de registry à gérer (GHCR + `GITHUB_TOKEN`).
- Images reproductibles (lockfile respecté, version Node unique du test à la prod).
- Builds rapides (mono-plateforme + cache GHA).

### Négatives
- Pas de portabilité ARM tant que le multi-arch n'est pas activé.
- Le scan Trivy bloquant peut casser une publication sur une CVE d'image de base → nécessite une politique de mise à jour des images de base.
- Dépendance au cycle de vie GHCR (lié au repo GitHub).

## Actions de suivi
- Adapter tous les `Dockerfile` des services : `node:24-alpine` + `npm ci`.
- Implémenter `publish.yml` (Buildx amd64, Trivy, push GHCR, tags).
- Définir la politique de tags de version (ex. SemVer sur release Git).
- Définir la conduite à tenir en cas de CVE bloquante sur une image de base (mise à jour, exception documentée).
