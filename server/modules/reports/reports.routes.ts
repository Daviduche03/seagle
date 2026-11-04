import { Router } from "express"
import { aiConfigured } from "../../env"
import { ApiError, asyncHandler } from "../../http/errors"
import { reportRequestSchema } from "./reports.schema"
import { draftFieldReport } from "./reports.service"

export const reportsRouter = Router()

reportsRouter.post(
  "/reports",
  asyncHandler(async (req, res) => {
    if (!aiConfigured) {
      throw new ApiError(503, "ai_not_configured", "META_API_KEY is not set")
    }
    const { fieldId } = reportRequestSchema.parse(req.body)
    res.json(await draftFieldReport(fieldId))
  }),
)
