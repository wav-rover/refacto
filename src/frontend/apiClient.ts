// Client HTTP du frontend vers l'API Gateway.
// Centralise les appels `/api/v1/...` : sert de base au contrat Front -> Gateway
// (les composants peuvent migrer vers ce client pour partager le même contrat).
import { apiBaseUrl } from "./config";

export type CurrentUser = { id: string; email: string };

export type RegisterPayload = {
  email: string;
  password: string;
  birthDate: string;
};

export type RegisteredUser = {
  id: string;
  email: string;
  birthDate: string;
  createdAt: string;
};

type JsonResponse<T> = { status: number; body: T | null };

async function getJson<T>(
  pathname: string,
  baseUrl: string = apiBaseUrl
): Promise<JsonResponse<T>> {
  const res = await fetch(`${baseUrl}${pathname}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  return { status: res.status, body: text ? (JSON.parse(text) as T) : null };
}

async function postJson<T>(
  pathname: string,
  payload: unknown,
  baseUrl: string = apiBaseUrl
): Promise<JsonResponse<T>> {
  const res = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return { status: res.status, body: text ? (JSON.parse(text) as T) : null };
}

export function fetchCurrentUser(baseUrl?: string): Promise<JsonResponse<CurrentUser>> {
  return getJson<CurrentUser>("/api/v1/auth/me", baseUrl);
}

export function registerUser(
  payload: RegisterPayload,
  baseUrl: string = apiBaseUrl
): Promise<JsonResponse<RegisteredUser>> {
  return postJson<RegisteredUser>("/api/v2/auth/register", payload, baseUrl);
}

export function fetchProjects(baseUrl?: string): Promise<JsonResponse<unknown[]>> {
  return getJson<unknown[]>("/api/v1/projects", baseUrl);
}

export function fetchNotifications(baseUrl?: string): Promise<JsonResponse<unknown[]>> {
  return getJson<unknown[]>("/api/v1/notifications", baseUrl);
}
