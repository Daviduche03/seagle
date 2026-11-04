import * as React from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, CornerDownLeft, Leaf, Loader2, Sparkles } from "lucide-react"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/status"
import { severityMeta, fieldStatusMeta } from "@/lib/status"
import { cn } from "@/lib/utils"
import { formatDate, relativeTime } from "@/lib/format"
import {
  observations,
  fields,
  farms,
  getField,
  getFarm,
  isOpen,
  escalatedObservations,
  surveysOfField,
  observationsOfField,
} from "@/data/store"

type Msg = { id: string; role: "user" | "assistant"; content: React.ReactNode }

const suggestions = [
  "Which fields need attention this week?",
  "Show unresolved observations older than two weeks.",
  "Which farms have the most high-severity findings?",
  "What changed in North Ridge since the previous inspection?",
]

interface Answer {
  answer: string
  citations: string[]
  followUps?: string[]
}

export function AssistantPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [messages, setMessages] = React.useState<Msg[]>([])
  const [input, setInput] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [mode, setMode] = React.useState<"live" | "demo">("demo")
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMode(data?.ai ? "live" : "demo"))
      .catch(() => setMode("demo"))
  }, [])

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages, busy])

  const ask = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || busy) return
    setInput("")
    const pending = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, role: "user", content: trimmed },
      {
        id: pending,
        role: "assistant",
        content: (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Reading the workspace…
          </span>
        ),
      },
    ])
    setBusy(true)

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      })
      if (!response.ok) throw new Error(`status ${response.status}`)
      const data = (await response.json()) as Answer
      setMessages((prev) => prev.map((msg) => (msg.id === pending ? { ...msg, content: <LiveAnswer data={data} /> } : msg)))
    } catch {
      setMode("demo")
      setMessages((prev) =>
        prev.map((msg) => (msg.id === pending ? { ...msg, content: answer(trimmed) } : msg)),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent width="440px" className="gap-0">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Sparkles className="size-3.5" />
            </span>
            <SheetTitle>Seagle assistant</SheetTitle>
            <Badge tone={mode === "live" ? "success" : "outline"} className="ml-1">
              {mode === "live" ? "Live model" : "Demo"}
            </Badge>
          </div>
          <SheetDescription>Answers come from your farm records, with the fields cited.</SheetDescription>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="rounded-sm bg-muted px-1.5 py-0.5">Organization</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="rounded-sm bg-muted px-1.5 py-0.5">All farms</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="rounded-sm bg-muted px-1.5 py-0.5">{fields.length} fields</span>
          </div>

          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Ask about field condition, inspection history or open observations.
              </p>
              <div className="space-y-1.5">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => ask(item)}
                    className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left text-[12px] transition-colors hover:border-[#cfdad2] hover:bg-muted/60"
                  >
                    <span>{item}</span>
                    <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col gap-1.5", msg.role === "user" ? "items-end" : "items-start")}>
              {msg.role === "user" ? (
                <p className="max-w-[92%] rounded-lg rounded-br-sm bg-accent px-3 py-2 text-[12.5px] text-accent-foreground">
                  {msg.content}
                </p>
              ) : (
                <div className="w-full rounded-lg rounded-bl-sm border border-border bg-card px-3 py-2.5 text-[12.5px] leading-relaxed">
                  {msg.content}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </SheetBody>

        <div className="border-t p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void ask(input)
            }}
            className="flex items-end gap-2 rounded-lg border border-input bg-card p-1.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/30"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void ask(input)
                }
              }}
              rows={1}
              placeholder="Ask about your farms…"
              className="max-h-24 min-h-7 flex-1 resize-none bg-transparent px-1.5 py-1 text-[12.5px] outline-none placeholder:text-muted-foreground/80"
            />
            <Button type="submit" size="icon-sm" aria-label="Send" disabled={!input.trim() || busy}>
              <ArrowUpRight />
            </Button>
          </form>
          <p className="mt-1.5 px-0.5 text-[10px] text-muted-foreground">
            {mode === "live"
              ? "Answers are generated from your records by the Meta model. Verify before acting."
              : "Demo mode — no model key configured, answers are composed from the dataset."}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function LiveAnswer({ data }: { data: Answer }) {
  return (
    <div className="space-y-2">
      <p>{data.answer}</p>
      {data.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.citations.map((id) => {
            const field = getField(id)
            if (!field) return null
            return (
              <Link
                key={id}
                to={`/fields/${id}`}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10.5px] text-foreground hover:bg-muted"
              >
                <Leaf className="size-2.5 text-muted-foreground" />
                {field.name}
              </Link>
            )
          })}
        </div>
      )}
      {data.followUps && data.followUps.length > 0 && (
        <div className="space-y-1 border-t pt-2">
          {data.followUps.slice(0, 2).map((item) => (
            <p key={item} className="text-[10.5px] text-muted-foreground">
              · {item}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Offline fallback — same answers the demo used before the model was wired.
// ---------------------------------------------------------------------------

function answer(question: string): React.ReactNode {
  const q = question.toLowerCase()

  if (q.includes("attention") || q.includes("this week")) {
    const list = escalatedObservations(5)
    return (
      <div className="space-y-2.5">
        <p>
          {list.length} open observations need attention. {list.filter((o) => o.severity === "critical").length} are
          critical and {list.filter((o) => o.severity === "high").length} are high severity:
        </p>
        <ul className="space-y-1.5">
          {list.map((obs) => {
            const field = getField(obs.fieldId)
            return (
              <li key={obs.id}>
                <Link
                  to={`/fields/${obs.fieldId}`}
                  className="group flex items-start gap-2 rounded-md border border-border px-2 py-1.5 hover:bg-muted"
                >
                  <Leaf className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">{obs.category}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {field?.name} · {getFarm(field?.farmId)?.name} · {relativeTime(obs.detectedAt)}
                    </span>
                  </span>
                  <StatusBadge meta={severityMeta[obs.severity]} showIcon={false} />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  if (q.includes("older than two weeks") || q.includes("unresolved")) {
    const cutoff = Date.now() - 14 * 86_400_000
    const list = observations.filter((o) => isOpen(o) && new Date(o.detectedAt).getTime() < cutoff)
    return (
      <div className="space-y-2.5">
        <p>{list.length} unresolved observations were first detected more than two weeks ago.</p>
        <ul className="space-y-1.5">
          {[...list]
            .sort((a, b) => +new Date(a.detectedAt) - +new Date(b.detectedAt))
            .slice(0, 6)
            .map((obs) => (
              <li key={obs.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5">
                <Link to={`/fields/${obs.fieldId}`} className="min-w-0 flex-1 truncate text-[12px] hover:underline">
                  {obs.category} — {getField(obs.fieldId)?.name}
                </Link>
                <span className="shrink-0 text-[11px] text-muted-foreground tabular">{formatDate(obs.detectedAt)}</span>
              </li>
            ))}
        </ul>
      </div>
    )
  }

  if (q.includes("farm")) {
    const rows = farms
      .map((farm) => {
        const open = observations.filter((o) => o.farmId === farm.id && isOpen(o))
        return {
          farm,
          high: open.filter((o) => o.severity === "critical" || o.severity === "high").length,
          open: open.length,
        }
      })
      .sort((a, b) => b.high - a.high)
    return (
      <div className="space-y-2.5">
        <p>Ranked by open high-severity findings:</p>
        <ol className="space-y-1.5">
          {rows.map((row, index) => (
            <li key={row.farm.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
              <span className="w-4 text-[11px] text-muted-foreground tabular">{index + 1}</span>
              <Link to={`/farms?farm=${row.farm.id}`} className="min-w-0 flex-1 truncate text-[12px] hover:underline">
                {row.farm.name}
              </Link>
              <span className="text-[11px] text-muted-foreground tabular">{row.open} open</span>
              <Badge tone={row.high > 2 ? "warning" : "neutral"}>{row.high} high</Badge>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (q.includes("north ridge")) {
    const field = fields.find((item) => item.name === "North Ridge")!
    const surveys = surveysOfField(field.id).filter((survey) => survey.status === "completed")
    const latest = surveys[0]
    const latestObs = observationsOfField(field.id).filter((obs) => obs.surveyId === latest?.id)
    return (
      <div className="space-y-2.5">
        <p>
          <strong>{field.name}</strong> is <strong>{fieldStatusMeta[field.status].label.toLowerCase()}</strong> across{" "}
          {field.areaHa} ha. The latest survey was captured {relativeTime(latest?.capturedAt)}.
        </p>
        {latestObs.length > 0 ? (
          <ul className="space-y-1">
            {latestObs.map((obs) => (
              <li key={obs.id} className="flex items-center gap-2 text-[12px]">
                <span className="size-1.5 rounded-full bg-[#b7791f]" />
                <span className="flex-1">{obs.category}</span>
                <span className="text-[11px] text-muted-foreground tabular">{Math.round(obs.confidence * 100)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No new observations were generated from the latest survey.</p>
        )}
        <Link
          to={`/fields/${field.id}?tab=findings`}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
        >
          Open field detail <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p>
        I can answer questions about field condition, open observations, inspection history and farm comparisons from
        the records in this workspace.
      </p>
      <p className="text-[11px] text-muted-foreground">Try one of the suggested questions, or name a field.</p>
    </div>
  )
}
