import * as React from "react"
import type { ObservationStatus } from "./types"

/**
 * Session-only review state.
 *
 * The demo dataset is a static JSON file, so reviews made during a session live
 * here instead of hitting a backend. Everything resets on reload — the UI says
 * so wherever a review action is offered.
 */
const reviews = new Map<string, { status: ObservationStatus; note: string | null }>()
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setReview(id: string, status: ObservationStatus, note: string | null = null) {
  reviews.set(id, { status, note })
  emit()
}

export function getReview(id: string) {
  return reviews.get(id)
}

export function useReview(id: string, fallback: ObservationStatus): ObservationStatus {
  return React.useSyncExternalStore(
    subscribe,
    () => reviews.get(id)?.status ?? fallback,
    () => fallback,
  )
}
