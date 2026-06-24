import { getApiVersion } from "./apiVersion";

const TASK_SERVICE_URL_ENV_KEY = "TASK_SERVICE_URL";

export function getTaskServiceUrl(): string {
  const url = process.env[TASK_SERVICE_URL_ENV_KEY];

  if (!url || url === "") {
    throw new Error(
      `Missing ${TASK_SERVICE_URL_ENV_KEY} environment variable for api-gateway.`
    );
  }

  // Préfixe de version (ex. ".../v1") propagé à tous les appels du service.
  return `${url.replace(/\/$/, "")}/${getApiVersion()}`;
}
