import { getApiVersion } from "./apiVersion";

const NOTIFICATION_SERVICE_URL_ENV_KEY = "NOTIFICATION_SERVICE_URL";

export function getNotificationServiceUrl(): string {
  const url = process.env[NOTIFICATION_SERVICE_URL_ENV_KEY];

  if (!url || url === "") {
    throw new Error(
      `Missing ${NOTIFICATION_SERVICE_URL_ENV_KEY} environment variable for api-gateway.`
    );
  }

  // Préfixe de version (ex. ".../v1") propagé à tous les appels du service.
  return `${url.replace(/\/$/, "")}/${getApiVersion()}`;
}
