import { Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WeeklyBars } from "@/components/common/charts"
import { cn } from "@/lib/utils"
import type { findingsSummary, WeeklyCount } from "@/data/store"

export function FindingsTrendCard({
  points,
  summary,
}: {
  points: WeeklyCount[]
  summary: ReturnType<typeof findingsSummary>
}) {
  const stats = [
    { label: "Open now", value: summary.open },
    { label: "High or critical", value: summary.escalated, tone: "warning" as const },
    { label: "Resolved", value: summary.resolved, tone: "success" as const },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Findings detected</CardTitle>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Observations from analyzed surveys · weekly, last {points.length} weeks
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-1">
        <WeeklyBars points={points} height={168} />

        <div className="mt-3 grid grid-cols-3 divide-x divide-border/70 border-t border-border/70 pt-3">
          {stats.map((stat) => (
            <div key={stat.label} className={cn("px-3 first:pl-0 last:pr-0")}>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <p
                className={cn(
                  "mt-1 text-[15px] leading-none font-semibold tabular",
                  stat.tone === "warning" && "text-warning",
                  stat.tone === "success" && "text-success",
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-auto flex items-start gap-1.5 pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
          <Info className="mt-px size-3 shrink-0" />
          <span>
            Counts come from recorded observations. No vegetation index is shown — most surveys are RGB, and NDVI
            requires multispectral imagery.
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
