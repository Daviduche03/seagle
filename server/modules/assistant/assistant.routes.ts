import { Router } from "express"
import { streamText } from "ai"
import { aiConfigured } from "../../env"
import { ApiError, asyncHandler } from "../../http/errors"
import { textModel } from "../ai/provider"
import { assistantRequestSchema } from "./assistant.schema"
import { answerQuestion, buildAssistantInput } from "./assistant.service"

export const assistantRouter = Router()

assistantRouter.post(
  "/assistant",
  asyncHandler(async (req, res) => {
    if (!aiConfigured) {
      throw new ApiError(503, "ai_not_configured", "META_API_KEY is not set")
    }
    const { question } = assistantRequestSchema.parse(req.body)
    const result = await answerQuestion(question)
    res.json(result)
  }),
)

assistantRouter.post(
  "/assistant/stream",
  asyncHandler(async (req, res) => {
    if (!aiConfigured) {
      throw new ApiError(503, "ai_not_configured", "META_API_KEY is not set")
    }
    const { question } = assistantRequestSchema.parse(req.body)
    const { system, prompt } = buildAssistantInput(question, "text")

    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("X-Accel-Buffering", "no")

    const result = streamText({
      model: textModel,
      system,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 3000,
    })

    result.pipeTextStreamToResponse(res)
  }),
)
