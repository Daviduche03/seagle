import { z } from "zod"

export const OBSERVATION_CATEGORIES = [
  "Disease symptoms",
  "Pest damage",
  "Weed presence",
  "Crop gaps",
  "Growth variability",
  "Discoloration",
  "Water stress indicators",
  "Nutrient stress indicators",
] as const

export const analysisRequestSchema = z.object({
  fieldId: z.string().min(1),
  image: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Expected a base64 image data URL"),
  sensor: z.enum(["RGB", "Multispectral", "Thermal"]).default("RGB"),
  capturedAt: z.string().optional(),
})

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>

export const analysisResultSchema = z.object({
  usable: z.boolean(),
  summary: z.string(),
  limitations: z.array(z.string()).max(4),
  observations: z
    .array(
      z.object({
        category: z.enum(OBSERVATION_CATEGORIES),
        severity: z.enum(["low", "medium", "high", "critical"]),
        confidence: z.number().min(0).max(1),
        observation: z.string().describe("What is visibly present in the image"),
        interpretation: z.string().describe("A suspected explanation, clearly not a diagnosis"),
        recommendation: z.string().describe("A concrete field verification step"),
        areaShare: z.number().min(0).max(100).describe("Approximate percentage of the frame affected"),
      }),
    )
    .max(4),
})

export type AnalysisResult = z.infer<typeof analysisResultSchema>
