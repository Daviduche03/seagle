import * as React from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sparkline } from "./charts"

export function StatCard({
  label,
  value,
  unit,
  supporting,
  to,
  trend,
  tone = "default",
  icon,
}: {
  label: string
  value: React.ReactNode
  unit?: string
  supporting?: React.ReactNode
  to?: string
  trend?: number[]
  tone?: "default" | "warning" | "danger"
  icon?: React.ReactNode
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {icon}
          {label}
        </span>
        {to && <ArrowUpRight className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-foreground" />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-[26px] leading-none font-semibold tracking-[-0.03em] tabular",
              tone === "warning" && "text-warning",
              tone === "danger" && "text-danger",
            )}
          >
            {value}
          </span>
          {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
        </div>
        {trend && <Sparkline values={trend} color={tone === "warning" ? "#b7791f" : "#5b8c6e"} />}
      </div>
      {supporting && <p className="mt-1.5 text-[11px] text-muted-foreground">{supporting}</p>}
    </>
  )

  const className = cn(
    "group block rounded-lg border bg-card px-3.5 pt-3 pb-3 text-left transition-colors",
    to && "hover:border-[#cfdad2] hover:bg-[#fdfefd]",
    tone === "warning" ? "border-warning-border/70" : "border-border",
  )

  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
