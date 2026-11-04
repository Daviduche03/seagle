import { Link } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { severityMeta } from "@/lib/status"
import { formatShortDate } from "@/lib/format"
import { getFarm, getField } from "@/data/store"
import type { Observation } from "@/data/types"

export function AttentionCard({
  items,
  total,
  onSelect,
}: {
  items: Observation[]
  total: number
  shown?: number
  onSelect: (observation: Observation) => void
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5">
        <span className="text-[10.5px] font-semibold tracking-[0.085em] text-[#74817a] uppercase">
          Needs attention
        </span>
        <span className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground tabular">{total} open</span>
          <Link to="/monitoring" className="text-muted-foreground transition-colors hover:text-foreground">
            All findings
          </Link>
        </span>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
          No high-priority findings. Everything is under review.
        </p>
      ) : (
        items.map((obs) => {
          const field = getField(obs.fieldId)!
          const farm = getFarm(field.farmId)!
          const critical = obs.severity === "critical"
          return (
            <button
              key={obs.id}
              onClick={() => onSelect(obs)}
              className="group relative flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
            >
              <span
                className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r-full"
                style={{ background: critical ? "#B3261E" : "#B7791F" }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] leading-tight font-medium">{field.name}</span>
                <span className="mt-1 block truncate text-[10.5px] leading-tight text-muted-foreground">
                  {obs.category} · {farm.name}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span
                  className="block text-[10.5px] leading-tight font-medium"
                  style={{ color: critical ? "#A12A22" : "#8F5710" }}
                >
                  {severityMeta[obs.severity].label}
                </span>
                <span className="mt-1 block text-[10.5px] leading-tight text-muted-foreground tabular">
                  {formatShortDate(obs.detectedAt)}
                </span>
              </span>
            </button>
          )
        })
      )}
    </Card>
  )
}
