# Phase 2 – Fiabilisation de l'environnement

Objectif : lockfile à jour et reproductibilité (installation, tests, versions critiques). **Aucun nouveau package** dans cette phase ; on met à jour uniquement les dépendances déjà présentes.

---

## 1. Mise à jour des dépendances existantes

Mettre à jour les packages déjà dans `package.json` (dans les ranges existants ou en ciblant `@latest` si souhaité). Une dépendance à la fois pour limiter les régressions.

Puis : `npm install` pour régénérer le lockfile.

---

## 2. Génération du lockfile

- À la racine : `npm install` (génère ou met à jour `package-lock.json`).
- Committer `package.json` et `package-lock.json` ensemble.

Régénérer après toute modification de `package.json` ou des `overrides`.

---

## 3. Vérification

### Installation

```bash
rm -rf node_modules
npm ci
```

Succès = pas d’erreur, `node_modules` recréé.

### Exécution des tests

```bash
npm test
```

Succès = tous les specs Jest passent.

### Versions critiques

Documenter (README ou ce doc) :

- **Lockfile** : `package-lock.json` ; ne pas changer de gestionnaire (npm) sans décision d’équipe.
- **Overrides** : garder la liste à jour après `npm audit`. Liste actuelle dans `package.json` : `@isaacs/brace-expansion`, `tar`, `glob`, `semver`, `cross-spawn`, `braces`, `http-cache-semantics`, `socks`

