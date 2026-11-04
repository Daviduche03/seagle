import * as React from "react"
import { useNavigate } from "react-router-dom"
import { CornerDownLeft, Leaf, MapPin, Plane, Search } from "lucide-react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { farms, fields, surveys, observations, getField, getFarm } from "@/data/store"
import { formatDate } from "@/lib/format"

interface Result {
  id: string
  group: string
  title: string
  subtitle: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const staticResults: Result[] = [
  ...farms.map((farm) => ({
    id: farm.id,
    group: "Farms",
    title: farm.name,
    subtitle: `${farm.region} · ${farm.fieldCount} fields`,
    to: `/farms?farm=${farm.id}`,
    icon: MapPin,
  })),
  ...fields.map((field) => ({
    id: field.id,
    group: "Fields",
    title: field.name,
    subtitle: `${getFarm(field.farmId)?.name} · ${field.code}`,
    to: `/fields/${field.id}`,
    icon: Leaf,
  })),
  ...observations.map((obs) => ({
    id: obs.id,
    group: "Findings",
    title: obs.title,
    subtitle: `${getField(obs.fieldId)?.name} · ${formatDate(obs.detectedAt)}`,
    to: `/fields/${obs.fieldId}?tab=findings&finding=${obs.id}`,
    icon: Leaf,
  })),
  ...surveys.slice(0, 20).map((survey) => ({
    id: survey.id,
    group: "Surveys",
    title: survey.name,
    subtitle: `${getField(survey.fieldId)?.name} · ${formatDate(survey.capturedAt)}`,
    to: `/drone?survey=${survey.id}`,
    icon: Plane,
  })),
]

export function CommandSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const navigate = useNavigate()

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return staticResults.slice(0, 8)
    return staticResults
      .filter((r) => `${r.title} ${r.subtitle}`.toLowerCase().includes(q))
      .slice(0, 10)
  }, [query])

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setActive(0)
    }
  }, [open])

  React.useEffect(() => {
    setActive(0)
  }, [query])

  const go = (result: Result | undefined) => {
    if (!result) return
    onOpenChange(false)
    navigate(result.to)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#101814]/35 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-[12vh] left-1/2 z-50 w-[min(620px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-[0_30px_90px_rgba(16,24,20,0.28)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.99]">
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <div className="flex items-center gap-2.5 border-b px-3.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setActive((a) => Math.min(a + 1, results.length - 1))
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setActive((a) => Math.max(a - 1, 0))
                }
                if (e.key === "Enter") {
                  e.preventDefault()
                  go(results[active])
                }
              }}
              placeholder="Search farms, fields, findings, surveys…"
              className="h-12 w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground/80"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
          </div>

          <div className="max-h-[46vh] overflow-y-auto p-1.5">
            {results.length === 0 && (
              <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
                No records match “{query}”.
              </p>
            )}
            {results.map((result, i) => {
              const showGroup = i === 0 || results[i - 1].group !== result.group
              return (
                <React.Fragment key={result.id}>
                  {showGroup && (
                    <p className="px-2.5 pt-2 pb-1 text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                      {result.group}
                    </p>
                  )}
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(result)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left",
                      i === active ? "bg-accent" : "hover:bg-muted",
                    )}
                  >
                    <result.icon className={cn("size-4 shrink-0", i === active ? "text-primary" : "text-muted-foreground")} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">{result.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{result.subtitle}</span>
                    </span>
                    {i === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                  </button>
                </React.Fragment>
              )
            })}
          </div>

          <div className="flex items-center gap-3 border-t bg-muted/40 px-3 py-1.5 text-[10.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-card px-1 py-0.5">↑</kbd>
              <kbd className="rounded border bg-card px-1 py-0.5">↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-card px-1 py-0.5">↵</kbd> open
            </span>
            <span className="ml-auto">Demo data · 3 farms, 16 fields</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
