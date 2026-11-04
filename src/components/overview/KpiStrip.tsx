import { Link } from "react-router-dom"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { escalatedObservations, type organizationKpis } from "@/data/store"
import type { Farm } from "@/data/types"

type Kpis = ReturnType<typeof organizationKpis>

export function KpiStrip({
  kpis,
  farms,
  crops,
}: {
  kpis: Kpis
  farms: Farm[]
  crops: { crop: string; ha: number }[]
}) {
  const farmIds = new Set(farms.map((farm) => farm.id))
  const escalated = escalatedObservations().filter((obs) => farmIds.has(obs.farmId))
  const critical = escalated.filter((obs) => obs.severity === "critical").length
  const high = escalated.filter((obs) => obs.severity === "high").length
  const fallow = kpis.fieldCount - kpis.activeFields
  const regions = farms.map((farm) => farm.region.replace(" County", "")).join(" · ")

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border xl:grid-cols-4">
      <Cell to="/farms" label="Farms" value={kpis.farmCount} detail={regions} />
      <Cell
        to="/farms"
        label="Cultivated area"
        value={kpis.cultivatedHa}
        unit="ha"
        detail={crops.map((crop) => `${crop.crop} ${crop.ha}`).join(" · ")}
      />
      <Cell
        to="/farms"
        label="Active fields"
        value={kpis.activeFields}
        detail={
          fallow > 0
            ? `${fallow} ${fallow === 1 ? "field" : "fields"} in fallow`
            : "All fields in an active cycle"
        }
      />
      <Cell
        to="/crop"
        label="Attention required"
        value={kpis.attention}
        detail={`${critical} critical · ${high} high`}
        tone="warning"
      />
    </div>
  )
}

function Cell({
  to,
  label,
  value,
  unit,
  detail,
  tone = "default",
}: {
  to: string
  label: string
  value: number
  unit?: string
  detail: string
  tone?: "default" | "warning"
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group bg-card px-4 py-[18px] transition-colors",
        tone === "warning" ? "bg-[#fdfaf3] hover:bg-[#fbf5e9]" : "hover:bg-[#fbfcfb]",
      )}
    >
      <p className="text-[10px] font-semibold tracking-[0.09em] text-[#74817a] uppercase transition-colors group-hover:text-[#3f4b43]">{label}</p>
      <p className="mt-2.5 flex items-baseline gap-1">
        <span className="text-[24px] leading-none font-semibold tracking-[-0.03em] tabular">
          {formatNumber(value)}
        </span>
        {unit && <span className="text-[11px] font-medium text-muted-foreground">{unit}</span>}
      </p>
      <p
        className={cn(
          "mt-2.5 truncate text-[11px] text-muted-foreground",
          tone === "warning" && "text-[#8f5710]",
        )}
        title={detail}
      >
        {detail}
      </p>
    </Link>
  )
}
