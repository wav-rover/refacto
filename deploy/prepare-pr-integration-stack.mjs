// Prépare la stack hybride pour les tests d'intégration PR :
//   - services modifiés → docker build local
//   - autres services   → docker pull depuis GHCR (version du manifeste)
// Toutes les images sont retaggées : ghcr.io/wav-rover/<svc>:pr-integration
//
// Variables d'entrée :
//   PR_CHANGED_SERVICES — JSON array, ex. ["auth-service","api-gateway"]
//   PR_BUILD_FRONT      — "true" | "false"
//   PR_GLOBAL           — "true" | "false" (build tous les services)
//   PR_MANIFEST         — chemin manifeste (défaut deploy/manifest.json)
//   PR_REGISTRY         — registry GHCR (défaut ghcr.io/wav-rover)
//   PR_LOCAL_TAG        — tag unifié (défaut pr-integration)
//   GITHUB_ENV          — si défini, exporte les *_VERSION pour docker compose

import { execSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

const MANIFEST_PATH = process.env.PR_MANIFEST ?? "deploy/manifest.json";
const REGISTRY = process.env.PR_REGISTRY ?? "ghcr.io/wav-rover";
const LOCAL_TAG = process.env.PR_LOCAL_TAG ?? "pr-integration";
const IS_GLOBAL = process.env.PR_GLOBAL === "true";
const BUILD_FRONT = process.env.PR_BUILD_FRONT === "true";

const changedServices = JSON.parse(process.env.PR_CHANGED_SERVICES ?? "[]");

const SERVICES = [
  "auth-service",
  "project-service",
  "task-service",
  "notification-service",
  "api-gateway",
  "frontend",
];

const DOCKERFILES = {
  "auth-service": "services/auth-service/Dockerfile",
  "project-service": "services/project-service/Dockerfile",
  "task-service": "services/task-service/Dockerfile",
  "notification-service": "services/notification-service/Dockerfile",
  "api-gateway": "services/api-gateway/Dockerfile",
  frontend: "Dockerfile.frontend",
};

const COMPOSE_ENV_KEYS = {
  "auth-service": "AUTH_SERVICE_VERSION",
  "project-service": "PROJECT_SERVICE_VERSION",
  "task-service": "TASK_SERVICE_VERSION",
  "notification-service": "NOTIFICATION_SERVICE_VERSION",
  "api-gateway": "API_GATEWAY_VERSION",
  frontend: "FRONTEND_VERSION",
};

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const versions = manifest.services ?? {};

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function shouldBuild(service) {
  if (IS_GLOBAL) return true;
  if (service === "frontend") return BUILD_FRONT;
  return changedServices.includes(service);
}

function imageRef(service) {
  return `${REGISTRY}/${service}:${LOCAL_TAG}`;
}

function buildImage(service) {
  const ref = imageRef(service);
  run(`docker build -t ${ref} -f ${DOCKERFILES[service]} .`);
}

function pullImage(service) {
  const version = versions[service];
  if (!version) {
    console.warn(`WARN  ${service} absent du manifeste — build local.`);
    buildImage(service);
    return;
  }

  const remote = `${REGISTRY}/${service}:${version}`;
  try {
    run(`docker pull ${remote}`);
    run(`docker tag ${remote} ${imageRef(service)}`);
    console.log(`OK  ${service} ← manifeste ${version}`);
  } catch {
    console.warn(
      `WARN  pull ${remote} échoué — fallback build local pour ${service}.`,
    );
    buildImage(service);
  }
}

function exportComposeEnv() {
  const lines = SERVICES.map(
    (svc) => `${COMPOSE_ENV_KEYS[svc]}=${LOCAL_TAG}`,
  ).join("\n");

  if (process.env.GITHUB_ENV) {
    appendFileSync(process.env.GITHUB_ENV, `${lines}\n`);
  }

  console.log("\n=== Variables compose (versions) ===");
  console.log(lines);
}

console.log("=== Préparation stack PR (intégration hybride) ===");
console.log(`Manifeste : ${MANIFEST_PATH}`);
console.log(`Global    : ${IS_GLOBAL}`);
console.log(`Front     : ${BUILD_FRONT}`);
console.log(`Modifiés  : ${JSON.stringify(changedServices)}`);

for (const service of SERVICES) {
  const ref = imageRef(service);
  if (shouldBuild(service)) {
    console.log(`\n--- Build local : ${service} → ${ref}`);
    buildImage(service);
  } else {
    console.log(`\n--- Pull stable : ${service} → ${ref}`);
    pullImage(service);
  }
}

exportComposeEnv();
console.log("\n=== Stack PR prête ===");
