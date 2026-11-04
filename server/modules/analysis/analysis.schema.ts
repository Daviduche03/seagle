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

const observationSchema = z.object({
  category: z.string().describe("One of the observation categories"),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  confidence: z.number().min(0).max(1).default(0.6),
  observation: z.string().describe("What is visibly present in the image"),
  interpretation: z.string().describe("A suspected explanation, clearly not a diagnosis"),
  recommendation: z.string().describe("A concrete field verification step"),
  areaShare: z
    .union([z.number(), z.string()])
    .optional()
    .describe("Approximate percentage of the frame affected"),
})

/**
 * The model sometimes answers with a single flat observation instead of the
 * array we ask for. Both shapes are accepted here and normalised in the
 * service, so one odd completion never turns into a 500 during a demo.
 */
export const analysisResultSchema = z.object({
  usable: z.boolean().default(true),
  summary: z.string().optional().default(""),
  observations: z.array(observationSchema).optional(),
  category: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
  observation: z.string().optional(),
  interpretation: z.string().optional(),
  recommendation: z.string().optional(),
  areaShare: z.union([z.number(), z.string()]).optional(),
  limitations: z.union([z.string(), z.array(z.string())]).optional(),
})

export type AnalysisResult = z.infer<typeof analysisResultSchema>
