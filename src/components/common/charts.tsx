import * as React from "react"
import { cn } from "@/lib/utils"
import { useSize } from "./useSize"

export interface TrendSeries {
  id: string
  label: string
  color: string
  points: { label: string; value: number }[]
  dashed?: boolean
}

export function TrendChart({
  series,
  height = 168,
  yDomain,
  yTicks = 4,
  valueFormat = (v: number) => `${Math.round(v)}`,
  className,
  showArea = true,
}: {
  series: TrendSeries[]
  height?: number
  yDomain?: [number, number]
  yTicks?: number
  valueFormat?: (value: number) => string
  className?: string
  showArea?: boolean
}) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [hover, setHover] = React.useState<number | null>(null)

  const labels = series[0]?.points.map((p) => p.label) ?? []
  const values = series.flatMap((s) => s.points.map((p) => p.value))
  const domain: [number, number] =
    yDomain ?? [Math.min(...values, 0), Math.max(...values, 100)]

  const padRight = 6
  const padTop = 6
  const padBottom = 6
  const plotW = Math.max(width - padRight, 10)
  const plotH = height - padTop - padBottom

  const x = (i: number) => (labels.length <= 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW)
  const y = (v: number) =>
    padTop + plotH - ((v - domain[0]) / Math.max(domain[1] - domain[0], 1)) * plotH

  const ticks = Array.from({ length: yTicks }, (_, i) => {
    const t = i / (yTicks - 1)
    return domain[0] + (domain[1] - domain[0]) * t
  })

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!labels.length) return
    const rect = event.currentTarget.getBoundingClientRect()
    const relative = event.clientX - rect.left
    const step = plotW / Math.max(labels.length - 1, 1)
    setHover(Math.max(0, Math.min(labels.length - 1, Math.round(relative / step))))
  }

  return (
    <div className={cn("flex w-full gap-2", className)}>
      <div className="flex shrink-0 flex-col justify-between py-1 text-right text-[10px] text-muted-foreground tabular">
        {[...ticks].reverse().map((t, i) => (
          <span key={i}>{valueFormat(t)}</span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div
          ref={ref}
          className="relative"
          style={{ height }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`Trend chart: ${series.map((s) => s.label).join(", ")}`}
        >
          {width > 0 && (
            <svg width={width} height={height} className="overflow-visible">
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.id} id={`area-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.16" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
                  </linearGradient>
                ))}
              </defs>

              {ticks.map((t, i) => (
                <line
                  key={i}
                  x1={0}
                  x2={plotW}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--chart-grid)"
                  strokeWidth={1}
                  strokeDasharray={i === 0 ? undefined : "3 4"}
                />
              ))}

              {series.map((s) => {
                const line = s.points
                  .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
                  .join(" ")
                const area = `${line} L${x(s.points.length - 1)},${padTop + plotH} L${x(0)},${padTop + plotH} Z`
                return (
                  <g key={s.id}>
                    {showArea && series.length === 1 && (
                      <path d={area} fill={`url(#area-${s.id})`} />
                    )}
                    <path
                      d={line}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={s.dashed ? "5 4" : undefined}
                    />
                    {s.points.map((p, i) => (
                      <circle
                        key={i}
                        cx={x(i)}
                        cy={y(p.value)}
                        r={hover === i ? 3.5 : 2.4}
                        fill="#fff"
                        stroke={s.color}
                        strokeWidth={1.8}
                      />
                    ))}
                  </g>
                )
              })}

              {hover != null && (
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={padTop}
                  y2={padTop + plotH}
                  stroke="#9aa79e"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              )}
            </svg>
          )}

          {hover != null && series[0] && (
            <div
              className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-md border border-border bg-card px-2 py-1.5 shadow-sm"
              style={{ left: Math.min(Math.max(x(hover), 56), plotW - 56) }}
            >
              <div className="text-[10px] text-muted-foreground">{labels[hover]}</div>
              {series.map((s) => (
                <div key={s.id} className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-[10.5px] text-muted-foreground">{s.label}</span>
                  <span className="ml-auto text-[11px] font-medium tabular">
                    {valueFormat(s.points[hover]?.value ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground tabular">
          {labels.map((label, i) => {
            const showEvery = Math.ceil(labels.length / 6)
            if (i % showEvery !== 0 && i !== labels.length - 1) return <span key={i} className="w-0" />
            return <span key={i}>{label}</span>
          })}
        </div>
      </div>
    </div>
  )
}

export function Sparkline({
  values,
  color = "#174B35",
  className,
}: {
  values: number[]
  color?: string
  className?: string
}) {
  const w = 88
  const h = 26
  const min = Math.min(...values)
  const max = Math.max(...values)
  const path = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w
      const y = h - ((v - min) / Math.max(max - min, 1)) * (h - 4) - 2
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-6 w-[88px]", className)} aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  )
}

export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-accent">
        <div
          className="h-full rounded-full bg-[#5b8c6e]"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-[11px] font-medium text-foreground tabular">{Math.round(value * 100)}%</span>
    </div>
  )
}

export function BarList({
  items,
  suffix = "",
}: {
  items: { label: string; value: number }[]
  suffix?: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[86px_1fr_auto] items-center gap-2.5">
          <span className="truncate text-[11.5px] text-muted-foreground">{item.label}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-[#5b8c6e]"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="text-[11.5px] font-medium tabular">
            {item.value}
            {suffix}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function WeeklyBars({
  points,
  height = 168,
  color = "#5b8c6e",
}: {
  points: { label: string; value: number }[]
  height?: number
  color?: string
}) {
  const max = Math.max(...points.map((p) => p.value), 1)
  const ticks = [max, Math.round(max / 2), 0]

  return (
    <div className="flex gap-2">
      <div
        className="flex w-5 shrink-0 flex-col justify-between text-right text-[10px] text-muted-foreground tabular"
        style={{ height }}
        aria-hidden
      >
        {ticks.map((tick, i) => (
          <span key={i} className="-my-1 first:mt-0 last:mb-0">
            {tick}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {[0, 50].map((top) => (
            <div
              key={top}
              className="absolute inset-x-0 border-t border-dashed border-[#e4ebe5]"
              style={{ top: `${top}%` }}
            />
          ))}
          <div className="relative flex h-full items-end justify-between gap-[3px] border-b border-[#dbe4dd]">
            {points.map((point) => (
              <div
                key={point.label}
                className="group flex h-full max-w-[32px] flex-1 items-end"
                title={`${point.label} · ${point.value} ${point.value === 1 ? "finding" : "findings"}`}
              >
                <div
                  className="w-full rounded-t-[3px] transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${Math.max((point.value / max) * 100, point.value === 0 ? 0 : 2)}%`,
                    background: color,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground tabular">
          <span>{points[0]?.label}</span>
          <span>{points[Math.floor(points.length / 2)]?.label}</span>
          <span>{points[points.length - 1]?.label}</span>
        </div>
      </div>
    </div>
  )
}
