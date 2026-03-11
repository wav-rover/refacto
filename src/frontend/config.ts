/**
 * Base URL for API calls (Gateway). Empty string = same origin.
 * When the front is served from a different port (e.g. monolith on 3100),
 * set window.__API_BASE_URL__ before loading the app (e.g. in index.html):
 * <script>window.__API_BASE_URL__ = "http://localhost:3000";</script>
 */
declare global {
  interface Window {
    __API_BASE_URL__?: string;
  }
}

export const apiBaseUrl =
  (typeof window !== "undefined" && window.__API_BASE_URL__) ?? "";
