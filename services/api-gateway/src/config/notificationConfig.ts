const NOTIFICATION_SERVICE_URL_ENV_KEY = "NOTIFICATION_SERVICE_URL";

export function getNotificationServiceUrl(): string {
  const url = process.env[NOTIFICATION_SERVICE_URL_ENV_KEY];

  if (!url || url === "") {
    throw new Error(
      `Missing ${NOTIFICATION_SERVICE_URL_ENV_KEY} environment variable for api-gateway.`
    );
  }

  return url;
}
