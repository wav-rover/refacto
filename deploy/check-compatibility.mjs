// Vérification de compatibilité inter-services AVANT déploiement (bloquant).
//
// Principe : chaque image Docker déclare, via ses LABEL,
//   - ce qu'elle FOURNIT  : provides.api-version="v1"
//   - ce qu'elle REQUIERT : requires.<service>=">=1.0.0 <2.0.0"  (plage SemVer)
// Ce script lit les versions réellement déployées dans deploy/manifest.json,
// récupère les labels de chaque image, puis vérifie (semver) que les versions
// du manifeste satisfont toutes les contraintes `requires`. Toute violation
// fait sortir le process en code 1 → le job CD échoue avant le moindre rollout.
//
// Sources de labels (env COMPAT_LABELS_SOURCE) :
//   - "remote" (défaut) : docker buildx imagetools inspect <registry>/<svc>:<version>
//   - "local"           : docker inspect <svc>:<COMPAT_LOCAL_TAG>   (images buildées localement)
//   - "file"            : JSON { "<svc>": { "<label>": "<valeur>" } } via COMPAT_LABELS_FILE
//                         (tests rapides, sans Docker)
//
// Autres variables : COMPAT_MANIFEST (défaut deploy/manifest.json),
//                    COMPAT_REGISTRY (défaut ghcr.io/wav-rover),
//                    COMPAT_LOCAL_TAG (défaut latest).

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import semver from "semver";

const MANIFEST = process.env.COMPAT_MANIFEST ?? "deploy/manifest.json";
const REGISTRY = process.env.COMPAT_REGISTRY ?? "ghcr.io/wav-rover";
const SOURCE = process.env.COMPAT_LABELS_SOURCE ?? "remote";
const LOCAL_TAG = process.env.COMPAT_LOCAL_TAG ?? "latest";

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const versions = manifest.services ?? {};

// --- Récupération des labels d'une image, selon la source configurée. --------

// Le template `{{json .Image}}` de buildx renvoie soit la config OCI directement
// (image mono-plateforme), soit une map plateforme -> config (image multi-arch).
function labelsFromImagetools(json) {
  const obj = JSON.parse(json);
  if (obj?.config) return obj.config.Labels ?? {};
  for (const v of Object.values(obj ?? {}))
    if (v?.config) return v.config.Labels ?? {};
  return {};
}

let fileLabels = null;
if (SOURCE === "file") {
  if (!process.env.COMPAT_LABELS_FILE)
    throw new Error("COMPAT_LABELS_SOURCE=file exige COMPAT_LABELS_FILE.");
  fileLabels = JSON.parse(readFileSync(process.env.COMPAT_LABELS_FILE, "utf8"));
}

function getLabels(service) {
  const version = versions[service];
  if (SOURCE === "file") return fileLabels[service] ?? {};
  if (SOURCE === "local") {
    const out = execSync(
      `docker inspect ${service}:${LOCAL_TAG} --format "{{json .Config.Labels}}"`,
      { encoding: "utf8" },
    );
    return JSON.parse(out) ?? {};
  }
  // remote (défaut)
  const out = execSync(
    `docker buildx imagetools inspect ${REGISTRY}/${service}:${version} --format "{{json .Image}}"`,
    { encoding: "utf8" },
  );
  return labelsFromImagetools(out);
}

// --- Vérifications -----------------------------------------------------------

const errors = [];
const labelsByService = {};

for (const service of Object.keys(versions)) {
  try {
    labelsByService[service] = getLabels(service);
  } catch (e) {
    errors.push(`Lecture des labels impossible pour ${service} : ${e.message}`);
    labelsByService[service] = {};
  }
}

// 1) Contraintes requires.<dep> : la version du manifeste doit satisfaire la plage.
for (const [service, labels] of Object.entries(labelsByService)) {
  for (const [key, range] of Object.entries(labels)) {
    if (!key.startsWith("requires.")) continue;
    const dep = key.slice("requires.".length);
    const depVersion = versions[dep];
    if (!depVersion) {
      errors.push(`${service} requiert ${dep} (absent du manifeste).`);
      continue;
    }
    if (!semver.satisfies(depVersion, range)) {
      errors.push(
        `${service} ${key}="${range}" NON satisfait : ${dep}=${depVersion} déployé.`,
      );
    } else {
      console.log(`OK  ${service} ${key}="${range}"  ← ${dep}=${depVersion}`);
    }
  }
}

// 2) Cohérence provides.api-version : toutes les images qui l'exposent doivent
//    annoncer la même version d'API que la gateway.
const gatewayApi = labelsByService["api-gateway"]?.["provides.api-version"];
if (gatewayApi) {
  for (const [service, labels] of Object.entries(labelsByService)) {
    const api = labels["provides.api-version"];
    if (api && api !== gatewayApi) {
      errors.push(
        `${service} provides.api-version="${api}" ≠ api-gateway "${gatewayApi}".`,
      );
    }
  }
  console.log(`OK  version d'API cohérente : "${gatewayApi}"`);
}

// --- Verdict -----------------------------------------------------------------

if (errors.length > 0) {
  console.error("\n=== Incompatibilités détectées (déploiement bloqué) ===");
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log("\n=== Compatibilité OK — déploiement autorisé ===");
