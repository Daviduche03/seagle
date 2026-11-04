import { z } from "zod"

export const assistantRequestSchema = z.object({
  question: z.string().min(3).max(500),
})

export const assistantResultSchema = z.object({
  answer: z.string().describe("Plain-language answer, three to six sentences"),
  citations: z.array(z.string()).max(12).default([]).describe("Field ids the answer relies on"),
  followUps: z.array(z.string()).max(3).optional().describe("Useful follow-up questions"),
})

export type AssistantResult = z.infer<typeof assistantResultSchema>
