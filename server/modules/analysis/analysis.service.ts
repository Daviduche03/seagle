import { generateObject } from "ai"
import { visionModel } from "../ai/provider"
import { getFieldContext } from "../workspace/repository"
import { ApiError } from "../../http/errors"
import { analysisResultSchema, type AnalysisRequest } from "./analysis.schema"
import { ANALYSIS_SYSTEM, buildAnalysisPrompt } from "./analysis.prompt"

export async function analyseFrame(input: AnalysisRequest) {
  const context = getFieldContext(input.fieldId)
  if (!context) throw new ApiError(404, "field_not_found", "Unknown field")

  const result = await generateObject({
    model: visionModel,
    schema: analysisResultSchema,
    temperature: 0.2,
    system: ANALYSIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildAnalysisPrompt(input, { ...context.field, findings: context.findings }) },
          { type: "image", image: input.image },
        ],
      },
    ],
  })

  return {
    ...result.object,
    field: context.field,
    model: "meta-vision",
  }
}
