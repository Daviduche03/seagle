import { loadEnvFile } from "node:process"

try {
  loadEnvFile(".env")
} catch {
  // no .env file — rely on the process environment
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  apiKey: process.env.META_API_KEY ?? "",
  baseURL: process.env.META_BASE_URL ?? "https://api.meta.ai/v1",
  model: process.env.META_MODEL ?? "muse-spark",
  visionModel: process.env.META_VISION_MODEL ?? process.env.META_MODEL ?? "muse-spark",
  allOrigins: process.env.ALLOW_ORIGIN ?? "http://localhost:5180",
}

export const aiConfigured = Boolean(env.apiKey)
