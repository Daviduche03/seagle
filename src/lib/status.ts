import type {
  ActionStatus,
  FieldStatus,
  ObservationStatus,
  Severity,
  SurveyStatus,
} from "@/data/types"

export type Tone = "neutral" | "info" | "success" | "warning" | "danger"
export type IconName =
  | "check"
  | "alert"
  | "eye"
  | "clock"
  | "help"
  | "dot"
  | "x"
  | "shield"

export interface StatusMeta {
  label: string
  tone: Tone
  icon: IconName
}

export const fieldStatusMeta: Record<FieldStatus, StatusMeta> = {
  healthy: { label: "Healthy", tone: "success", icon: "check" },
  review: { label: "Needs review", tone: "neutral", icon: "eye" },
  attention: { label: "Attention", tone: "warning", icon: "alert" },
  critical: { label: "Critical", tone: "danger", icon: "shield" },
  unverified: { label: "Unverified", tone: "neutral", icon: "help" },
}

export const surveyStatusMeta: Record<SurveyStatus, StatusMeta> = {
  queued: { label: "Queued", tone: "neutral", icon: "clock" },
  uploading: { label: "Uploading", tone: "info", icon: "clock" },
  validating: { label: "Validating", tone: "info", icon: "clock" },
  processing: { label: "Processing", tone: "info", icon: "clock" },
  analyzing: { label: "Analyzing", tone: "info", icon: "eye" },
  completed: { label: "Analyzed", tone: "success", icon: "check" },
  failed: { label: "Failed", tone: "danger", icon: "alert" },
}

export const observationStatusMeta: Record<ObservationStatus, StatusMeta> = {
  new: { label: "New", tone: "info", icon: "dot" },
  recurring: { label: "Recurring", tone: "warning", icon: "alert" },
  under_review: { label: "Under review", tone: "neutral", icon: "eye" },
  resolved: { label: "Resolved", tone: "success", icon: "check" },
  unverified: { label: "Unverified", tone: "neutral", icon: "help" },
}

export const severityMeta: Record<Severity, StatusMeta> = {
  low: { label: "Low", tone: "neutral", icon: "dot" },
  medium: { label: "Medium", tone: "info", icon: "dot" },
  high: { label: "High", tone: "warning", icon: "alert" },
  critical: { label: "Critical", tone: "danger", icon: "shield" },
}

export const actionStatusMeta: Record<ActionStatus, StatusMeta> = {
  todo: { label: "To do", tone: "neutral", icon: "dot" },
  in_progress: { label: "In progress", tone: "info", icon: "clock" },
  completed: { label: "Completed", tone: "success", icon: "check" },
  verified: { label: "Verified", tone: "success", icon: "shield" },
}

export const priorityMeta: Record<"low" | "medium" | "high", StatusMeta> = {
  low: { label: "Low", tone: "neutral", icon: "dot" },
  medium: { label: "Medium", tone: "info", icon: "dot" },
  high: { label: "High", tone: "warning", icon: "alert" },
}

export const toneClasses: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-neutral border-neutral-border",
  info: "bg-info-soft text-info border-info-border",
  success: "bg-success-soft text-success border-success-border",
  warning: "bg-warning-soft text-warning border-warning-border",
  danger: "bg-danger-soft text-danger border-danger-border",
}

export const fieldFill: Record<FieldStatus, string> = {
  healthy: "#2f6b4a",
  review: "#9aa79e",
  attention: "#b7791f",
  critical: "#b3261e",
  unverified: "#8b9690",
}

export const fieldStroke: Record<FieldStatus, string> = {
  healthy: "#1b4a31",
  review: "#6d7a71",
  attention: "#8a5a12",
  critical: "#8c1c16",
  unverified: "#5f6a63",
}
