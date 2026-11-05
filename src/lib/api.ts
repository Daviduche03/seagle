/**
 * The SPA calls `/api` on its own origin by default. When the frontend and the
 * API are deployed separately, set VITE_API_BASE_URL at build time, e.g.
 * https://seagle-api.onrender.com
 */
const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "")

export function apiUrl(path: string) {
  return `${base}${path}`
}
