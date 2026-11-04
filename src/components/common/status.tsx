import {
  CheckCircle2,
  Circle,
  CircleHelp,
  Clock,
  Eye,
  ShieldAlert,
  TriangleAlert,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { IconName, StatusMeta, Tone } from "@/lib/status"

const icons = {
  check: CheckCircle2,
  alert: TriangleAlert,
  eye: Eye,
  clock: Clock,
  help: CircleHelp,
  dot: Circle,
  x: XCircle,
  shield: ShieldAlert,
} satisfies Record<IconName, React.ComponentType<{ className?: string }>>

export function StatusIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = icons[name]
  return <Icon className={className} />
}

export function StatusBadge({
  meta,
  className,
  showIcon = true,
  variant = "badge",
}: {
  meta: StatusMeta
  className?: string
  showIcon?: boolean
  variant?: "badge" | "dot"
}) {
  if (variant === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[11.5px] whitespace-nowrap", dotText[meta.tone], className)}>
        <span className={cn("size-1.5 shrink-0 rounded-full", dotFill[meta.tone])} aria-hidden />
        {meta.label}
      </span>
    )
  }

  return (
    <Badge tone={meta.tone} className={className}>
      {showIcon && <StatusIcon name={meta.icon} />}
      {meta.label}
    </Badge>
  )
}

const dotText: Record<Tone, string> = {
  neutral: "text-neutral",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
}

const dotFill: Record<Tone, string> = {
  neutral: "bg-neutral",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
}

export function ToneDot({ tone, className }: { tone: Tone; className?: string }) {
  const fill: Record<Tone, string> = {
    neutral: "bg-neutral",
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }
  return <span className={cn("size-1.5 rounded-full", fill[tone], className)} />
}
