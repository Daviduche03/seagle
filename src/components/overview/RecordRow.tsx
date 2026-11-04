import * as React from "react"
import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "neutral" | "info" | "success" | "warning" | "danger"

const tileTone: Record<Tone, string> = {
  neutral: "border-border/70 bg-muted/60 text-muted-foreground",
  info: "border-info-border bg-info-soft text-info",
  success: "border-success-border bg-success-soft text-success",
  warning: "border-warning-border bg-warning-soft text-warning",
  danger: "border-danger-border bg-danger-soft text-danger",
}

export function RecordRow({
  icon: Icon,
  tone = "neutral",
  title,
  meta,
  right,
  to,
  onClick,
  titleTooltip,
}: {
  icon: LucideIcon
  tone?: Tone
  title: React.ReactNode
  meta: React.ReactNode
  right?: React.ReactNode
  to?: string
  onClick?: () => void
  titleTooltip?: string
}) {
  const inner = (
    <>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
          tileTone[tone],
        )}
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] leading-tight font-medium" title={titleTooltip}>
          {title}
        </span>
        <span className="mt-1 block truncate text-[10.5px] leading-tight text-muted-foreground">{meta}</span>
      </span>
      {right && <span className="shrink-0 text-right">{right}</span>}
    </>
  )

  const className =
    "group flex w-full items-center gap-2.5 border-b border-border/70 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/40"

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    )
  }

  return <div className={className}>{inner}</div>
}

export function RowRight({
  primary,
  secondary,
  tone = "default",
  secondaryTone = "default",
}: {
  primary: React.ReactNode
  secondary?: React.ReactNode
  tone?: "default" | "warning" | "danger" | "success"
  secondaryTone?: "default" | "danger"
}) {
  return (
    <span className="flex flex-col items-end gap-1">
      <span
        className={cn(
          "text-[11px] leading-none font-medium whitespace-nowrap",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
        )}
      >
        {primary}
      </span>
      {secondary && (
        <span
          className={cn(
            "text-[10.5px] leading-none whitespace-nowrap tabular",
            secondaryTone === "danger" ? "text-danger" : "text-muted-foreground",
          )}
        >
          {secondary}
        </span>
      )}
    </span>
  )
}
