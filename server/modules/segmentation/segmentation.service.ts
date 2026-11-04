import { env } from "../../env"
import { ApiError } from "../../http/errors"

export interface SegmentBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface SegmentResult {
  prompt: string
  count: number
  /** Percentage of the frame covered by the union of returned boxes. */
  coverage: number
  boxes: SegmentBox[]
  frame: { width: number; height: number } | null
}

interface ResponsesPayload {
  output?: { content?: { type?: string; text?: string }[] }[]
  error?: { message?: string } | null
}

const BOX = /<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)\|>/g

/**
 * SAM 3.1, through the same Meta Model API key as the rest of the stack.
 * It lives on the Responses surface, not chat completions: media + a short
 * noun phrase in, boxes and masks out. We use the boxes for coverage and keep
 * the masks out of the product until we can decode them reliably.
 */
export async function segmentFrame(image: string, prompt: string): Promise<SegmentResult> {
  const base = env.baseURL.replace(/\/+$/, "")
  const response = await fetch(`${base}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sam-3.1",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: image },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new ApiError(502, "segmentation_failed", `SAM 3.1 returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`)
  }

  const data = (await response.json()) as ResponsesPayload
  const text = data.output?.[0]?.content?.find((part) => part.type === "output_text")?.text ?? ""

  const boxes: SegmentBox[] = []
  let width = 0
  let height = 0
  for (const match of text.matchAll(BOX)) {
    const [, x1, y1, x2, y2, w, h] = match
    boxes.push({ x1: Number(x1), y1: Number(y1), x2: Number(x2), y2: Number(y2) })
    width = Number(w)
    height = Number(h)
  }

  return {
    prompt,
    count: boxes.length,
    coverage: unionCoverage(boxes, width, height),
    boxes,
    frame: width && height ? { width, height } : null,
  }
}

/** Approximate union coverage by sampling a grid, so overlapping boxes don't inflate it. */
function unionCoverage(boxes: SegmentBox[], width: number, height: number) {
  if (!boxes.length || !width || !height) return 0
  const grid = 96
  let hits = 0
  for (let gy = 0; gy < grid; gy++) {
    const y = ((gy + 0.5) / grid) * height
    for (let gx = 0; gx < grid; gx++) {
      const x = ((gx + 0.5) / grid) * width
      if (boxes.some((box) => x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2)) hits++
    }
  }
  return Math.round((hits / (grid * grid)) * 1000) / 10
}
