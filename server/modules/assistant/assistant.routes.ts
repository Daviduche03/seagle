import { Router } from "express"
import { aiConfigured } from "../../env"
import { ApiError, asyncHandler } from "../../http/errors"
import { assistantRequestSchema } from "./assistant.schema"
import { answerQuestion } from "./assistant.service"

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
