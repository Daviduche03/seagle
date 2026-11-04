import { Router } from "express"
import { aiConfigured } from "../../env"
import { ApiError, asyncHandler } from "../../http/errors"
import { analysisRequestSchema } from "./analysis.schema"
import { analyseFrame } from "./analysis.service"

export const analysisRouter = Router()

analysisRouter.post(
  "/analysis",
  asyncHandler(async (req, res) => {
    if (!aiConfigured) {
      throw new ApiError(503, "ai_not_configured", "META_API_KEY is not set")
    }
    const input = analysisRequestSchema.parse(req.body)
    const result = await analyseFrame(input)
    res.json(result)
  }),
)
