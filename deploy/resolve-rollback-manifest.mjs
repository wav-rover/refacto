// Résout le manifeste de rollback pour la CD production (étape 9).
// 1. Lit le snapshot VM (prod-rollback-manifest.json)
// 2. Si vide : repli sur le commit git précédent de deploy/manifest.json
// 3. Réécrit le fichier normalisé ; exporte *_VERSION vers GITHUB_ENV si défini
//
// Usage : node deploy/resolve-rollback-manifest.mjs [chemin-snapshot]

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const SNAPSHOT_PATH = process.argv[2] ?? "prod-rollback-manifest.json";
const MANIFEST_GIT_PATH = "deploy/manifest.json";

function readSnapshot() {
  try {
    const raw = readFileSync(SNAPSHOT_PATH, "utf8").trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.services && Object.keys(parsed.services).length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

function readGitPrevious() {
  try {
    const commits = execSync(`git log -2 --format=%H -- ${MANIFEST_GIT_PATH}`, {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
    if (commits.length < 2) return null;
    const raw = execSync(`git show ${commits[1]}:${MANIFEST_GIT_PATH}`, {
      encoding: "utf8",
    });
    const parsed = JSON.parse(raw);
    if (parsed.services && Object.keys(parsed.services).length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

function servicesToEnv(services) {
  return Object.entries(services)
    .map(([s, v]) => `${s.toUpperCase().replace(/-/g, "_")}_VERSION=${v}`)
    .join("\n");
}

const manifest = readSnapshot() ?? readGitPrevious();
const hasRollback = manifest !== null;

if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `has_rollback=${hasRollback}\n`);

if (!hasRollback) {
  console.warn("WARN: aucun manifeste de rollback disponible — aucune action.");
  process.exit(0);
}

writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log("=== Manifeste rollback ===");
console.log(JSON.stringify(manifest, null, 2));

if (process.env.GITHUB_ENV)
  appendFileSync(process.env.GITHUB_ENV, `${servicesToEnv(manifest.services)}\n`);
