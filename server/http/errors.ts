import type { NextFunction, Request, RequestHandler, Response } from "express"
import { ZodError } from "zod"

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export function asyncHandler(handler: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next)
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.code, message: error.message })
    return
  }
  if (error instanceof ZodError) {
    res.status(422).json({ error: "invalid_request", issues: error.issues })
    return
  }
  console.error("[api] unhandled", error)
  const message = error instanceof Error ? error.message : "Unexpected error"
  res.status(500).json({ error: "internal_error", message })
}
