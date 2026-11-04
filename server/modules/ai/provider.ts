import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { env } from "../../env"

/**
 * Meta Model API is exposed through an OpenAI-compatible surface, so one
 * provider covers every model we use. Swap META_BASE_URL / META_MODEL without
 * touching call sites.
 */
const meta = createOpenAICompatible({
  name: "meta",
  baseURL: env.baseURL,
  apiKey: env.apiKey,
})

export const textModel = meta(env.model)
export const visionModel = meta(env.visionModel)
