import { getApiVersion } from "./apiVersion";

const AUTH_SERVICE_URL_ENV_KEY = "AUTH_SERVICE_URL";

export function getAuthServiceUrl(): string {
  const url = process.env[AUTH_SERVICE_URL_ENV_KEY];

  if (!url || url === "") {
    throw new Error(`Missing ${AUTH_SERVICE_URL_ENV_KEY} environment variable for api-gateway.`);
  }

  // Préfixe de version (ex. ".../v1") propagé à tous les appels du service (dont /auth/me).
  return `${url.replace(/\/$/, "")}/${getApiVersion()}`;
}

