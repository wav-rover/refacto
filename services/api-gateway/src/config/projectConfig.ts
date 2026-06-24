import { getApiVersion } from "./apiVersion";

const PROJECT_SERVICE_URL_ENV_KEY = "PROJECT_SERVICE_URL";

export function getProjectServiceUrl(): string {
  const url = process.env[PROJECT_SERVICE_URL_ENV_KEY];

  if (!url || url === "") {
    throw new Error(
      `Missing ${PROJECT_SERVICE_URL_ENV_KEY} environment variable for api-gateway.`
    );
  }

  // Préfixe de version (ex. ".../v1") propagé à tous les appels du service.
  return `${url.replace(/\/$/, "")}/${getApiVersion()}`;
}
