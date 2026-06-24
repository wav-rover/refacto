// Version d'API exposée par la gateway et propagée aux microservices.
// Dérivée du numéro de version majeur du package.json (1.x.x -> "v1").
// Surchargeable via la variable d'environnement API_VERSION (ex. "v2").
export function getApiVersion(): string {
  return process.env.API_VERSION ?? "v1";
}
