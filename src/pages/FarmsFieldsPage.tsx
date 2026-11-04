import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, ChevronRight, MapPin, Plus, Search } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/status"
import { FieldMap } from "@/components/maps/FieldMap"
import { fieldStatusMeta } from "@/lib/status"
import { formatArea, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  escalatedObservations,
  farms,
  fieldsOfFarm,
  getCropCycle,
  getField,
  latestSurvey,
  observationsOfField,
  surveysOfFarm,
} from "@/data/store"

export function FarmsFieldsPage() {
  const navigate = useNavigate()
  const [farmId, setFarmId] = React.useState(farms[0].id)
  const [selectedId, setSelectedId] = React.useState<string | null>(fieldsOfFarm(farms[0].id)[0]?.id ?? null)
  const [query, setQuery] = React.useState("")
  const [focusKey, setFocusKey] = React.useState(0)

  const farm = farms.find((f) => f.id === farmId)!
  const farmFields = fieldsOfFarm(farmId)
  const selected = getField(selectedId)
  const filtered = query
    ? farmFields.filter((field) => field.name.toLowerCase().includes(query.toLowerCase()))
    : farmFields

  const selectFarm = (id: string) => {
    setFarmId(id)
    setSelectedId(fieldsOfFarm(id)[0]?.id ?? null)
    setFocusKey((key) => key + 1)
  }

  return (
    <>
      <PageHeader
        title="Farms & Fields"
        subtitle={`${farms.length} farms · ${farms.reduce((sum, item) => sum + item.fieldCount, 0)} fields mapped`}
        actions={
          <Button className="gap-1.5" onClick={() => navigate("/drone?upload=1")}>
            <Plus /> Add field
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(300px,0.4fr)_1fr]">
        <Card className="flex max-h-[660px] flex-col overflow-hidden">
          <div className="flex gap-1 overflow-x-auto border-b p-2">
            {farms.map((item) => (
              <button
                key={item.id}
                onClick={() => selectFarm(item.id)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                  item.id === farmId ? "bg-accent text-accent-foreground" : "text-[#46534a] hover:bg-muted",
                )}
              >
                {item.name.replace(" Farm", "")}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 px-3 pt-3">
            <div>
              <p className="text-[13px] font-semibold">{farm.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {farm.region} · {farm.fieldCount} fields · {formatArea(farm.totalAreaHa)}
              </p>
            </div>
            <Badge tone="outline">{surveysOfFarm(farm.id).length} surveys</Badge>
          </div>

          <div className="relative px-3 py-2.5">
            <Search className="absolute top-1/2 left-5.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fields"
              className="h-8 pl-8"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.map((field) => {
              const cycle = getCropCycle(field)
              const survey = latestSurvey(field.id)
              const open = observationsOfField(field.id).filter((obs) => obs.status !== "resolved")
              return (
                <button
                  key={field.id}
                  onClick={() => {
                    setSelectedId(field.id)
                    setFocusKey((key) => key + 1)
                  }}
                  onDoubleClick={() => navigate(`/fields/${field.id}`)}
                  className={cn(
                    "flex w-full items-center gap-2.5 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/50",
                    field.id === selectedId && "bg-accent/60",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: fieldStatusMeta[field.status].tone === "danger" ? "#B3261E" : field.status === "attention" ? "#B7791F" : field.status === "healthy" ? "#2F6B4A" : "#9AA79E" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium">{field.name}</span>
                    <span className="block truncate text-[10.5px] text-muted-foreground">
                      {field.code} · {cycle?.crop ?? "Fallow"} · {formatArea(field.areaHa)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[10.5px] text-muted-foreground">
                      {survey ? formatDate(survey.capturedAt) : "No survey"}
                    </span>
                    {open.length > 0 && (
                      <span className="mt-0.5 block text-[10.5px] font-medium text-warning">{open.length} open</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
            <span className="truncate text-[11px] text-muted-foreground">
              {selected ? selected.name : "Select a field"}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              disabled={!selected}
              onClick={() => selected && navigate(`/fields/${selected.id}`)}
            >
              Open field <ArrowRight />
            </Button>
          </div>
        </Card>

        <div className="relative h-[660px]">
          <FieldMap
            fields={farmFields}
            observations={escalatedObservations().filter((obs) => obs.farmId === farmId)}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onOpen={(id) => navigate(`/fields/${id}`)}
            focus={{ fieldIds: farmFields.map((field) => field.id), key: focusKey }}
            className="h-full"
            showBasemapToggle={false}
          />
          {selected && (
            <div className="pointer-events-none absolute right-3 bottom-3 w-[230px] rounded-lg border border-border bg-card/97 p-3 shadow-[0_10px_30px_rgba(16,24,20,0.16)]">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                <span className="text-[12.5px] font-semibold">{selected.name}</span>
                <ChevronRight className="ml-auto size-3.5 text-muted-foreground/50" />
              </div>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                {getCropCycle(selected)?.crop ?? "Fallow"} · {formatArea(selected.areaHa)}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge meta={fieldStatusMeta[selected.status]} />
                <Link to={`/fields/${selected.id}`} className="text-[11px] font-medium text-primary hover:underline">
                  Open →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
