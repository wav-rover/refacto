// Spécification OpenAPI 3.0 de l'API publique (v1) exposée par la gateway.
// Servie uniquement en développement (cf. server.ts) sur GET /api/v1/openapi.json.
import { getApiVersion } from "./config/apiVersion";

export function buildOpenApiDocument(): Record<string, unknown> {
  const version = getApiVersion();

  return {
    openapi: "3.0.3",
    info: {
      title: "Refacto API",
      version: "1.0.0",
      description:
        "API publique de l'application (gestion de projets et de tâches), exposée par l'API Gateway. " +
        "Toutes les routes sont versionnées sous /api/" + version + ".",
    },
    servers: [{ url: "/api/" + version }],
    tags: [
      { name: "auth", description: "Authentification et sessions" },
      { name: "projects", description: "Projets et membres" },
      { name: "tasks", description: "Tâches" },
      { name: "notifications", description: "Notifications" },
    ],
    paths: {
      "/auth/register": {
        post: {
          tags: ["auth"],
          summary: "Créer un compte utilisateur",
          responses: { "201": { description: "Compte créé" }, "400": { description: "Entrée invalide" } },
        },
      },
      "/auth/login": {
        post: {
          tags: ["auth"],
          summary: "Se connecter (ouvre une session)",
          responses: { "200": { description: "Connecté" }, "401": { description: "Identifiants invalides" } },
        },
      },
      "/auth/logout": {
        post: { tags: ["auth"], summary: "Se déconnecter", responses: { "200": { description: "Déconnecté" } } },
      },
      "/auth/me": {
        get: {
          tags: ["auth"],
          summary: "Identité de l'utilisateur courant",
          responses: { "200": { description: "Utilisateur courant" }, "401": { description: "Non authentifié" } },
        },
      },
      "/projects": {
        get: { tags: ["projects"], summary: "Lister les projets", responses: { "200": { description: "Liste des projets" } } },
        post: {
          tags: ["projects"],
          summary: "Créer un projet",
          responses: { "201": { description: "Projet créé" }, "400": { description: "Entrée invalide" } },
        },
      },
      "/projects/{projectId}/close": {
        post: {
          tags: ["projects"],
          summary: "Clôturer un projet (propriétaire uniquement)",
          parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Projet clôturé" },
            "403": { description: "Interdit" },
            "404": { description: "Projet introuvable" },
            "409": { description: "Déjà clôturé" },
          },
        },
      },
      "/projects/{projectId}/members": {
        post: {
          tags: ["projects"],
          summary: "Ajouter un membre",
          parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Membre ajouté" }, "403": { description: "Interdit" } },
        },
      },
      "/projects/{projectId}/members/{userId}": {
        delete: {
          tags: ["projects"],
          summary: "Retirer un membre",
          parameters: [
            { name: "projectId", in: "path", required: true, schema: { type: "string" } },
            { name: "userId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Membre retiré" }, "403": { description: "Interdit" } },
        },
      },
      "/tasks": {
        get: { tags: ["tasks"], summary: "Lister les tâches", responses: { "200": { description: "Liste des tâches" } } },
        post: {
          tags: ["tasks"],
          summary: "Créer une tâche",
          responses: { "201": { description: "Tâche créée" }, "400": { description: "Entrée invalide" } },
        },
      },
      "/tasks/project/{projectId}": {
        get: {
          tags: ["tasks"],
          summary: "Lister les tâches d'un projet",
          parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Tâches du projet" } },
        },
      },
      "/tasks/{taskId}": {
        patch: {
          tags: ["tasks"],
          summary: "Mettre à jour une tâche",
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Tâche mise à jour" }, "404": { description: "Introuvable" } },
        },
        delete: {
          tags: ["tasks"],
          summary: "Supprimer une tâche",
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Tâche supprimée" } },
        },
      },
      "/tasks/{taskId}/assign": {
        post: {
          tags: ["tasks"],
          summary: "Affecter une tâche à un utilisateur",
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Tâche affectée" } },
        },
      },
      "/tasks/{taskId}/complete": {
        post: {
          tags: ["tasks"],
          summary: "Marquer une tâche terminée",
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Tâche terminée" } },
        },
      },
      "/tasks/{taskId}/reopen": {
        post: {
          tags: ["tasks"],
          summary: "Réouvrir une tâche",
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Tâche réouverte" } },
        },
      },
      "/notifications": {
        get: {
          tags: ["notifications"],
          summary: "Lister les notifications de l'utilisateur courant",
          responses: { "200": { description: "Liste des notifications" }, "401": { description: "Non authentifié" } },
        },
      },
    },
  };
}
