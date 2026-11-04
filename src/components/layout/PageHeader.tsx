import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-[11.5px] text-muted-foreground", className)}>
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/50" />}
          {item.href && i < items.length - 1 ? (
            <Link to={item.href} className="rounded-sm transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className={cn(i === items.length - 1 && "text-foreground/80")}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  meta,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  breadcrumbs?: Crumb[]
  actions?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-4", className)}>
      <div className="min-w-0">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-1.5" />}
        <h1 className="truncate text-[22px] leading-tight font-semibold tracking-[-0.022em]">{title}</h1>
        {subtitle && <p className="mt-1 text-[12.5px] text-muted-foreground">{subtitle}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: React.ReactNode
  hint?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em]">{children}</h2>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d5dfd7] bg-[#fbfcfb] text-center",
        compact ? "gap-1.5 px-4 py-6" : "gap-2 px-6 py-10",
        className,
      )}
    >
      {icon && <div className="mb-0.5 text-muted-foreground/70">{icon}</div>}
      <p className="text-[13px] font-medium">{title}</p>
      {description && <p className="max-w-sm text-[12px] leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function DataNote({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode
  tone?: "neutral" | "warning" | "info"
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-2.5 py-2 text-[11.5px] leading-relaxed",
        tone === "neutral" && "border-neutral-border bg-neutral-soft text-neutral",
        tone === "warning" && "border-warning-border bg-warning-soft text-warning",
        tone === "info" && "border-info-border bg-info-soft text-info",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function KeyValue({
  label,
  value,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <dt className="text-[10.5px] tracking-[0.01em] text-muted-foreground">{label}</dt>
      <dd className="text-[12.5px] font-medium text-foreground">{value}</dd>
    </div>
  )
}
