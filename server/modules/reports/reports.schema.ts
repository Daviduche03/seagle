import { z } from "zod"

export const reportRequestSchema = z.object({
  fieldId: z.string().min(1),
})

export const reportResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        body: z.string(),
      }),
    )
    .min(2)
    .max(5),
  caveats: z.array(z.string()).max(4),
})

export type ReportResult = z.infer<typeof reportResultSchema>
