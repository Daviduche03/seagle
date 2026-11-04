import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Bell, Menu, Plus, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { relativeTime } from "@/lib/format"
import { events, getField, organization } from "@/data/store"

export function Topbar({
  onOpenSearch,
  onOpenAssistant,
  onOpenNav,
}: {
  onOpenSearch: () => void
  onOpenAssistant: () => void
  onOpenNav: () => void
}) {
  const navigate = useNavigate()
  const notifications = React.useMemo(
    () =>
      events
        .filter((e) => e.kind === "analysis" || e.kind === "system" || e.kind === "report")
        .slice(0, 4),
    [],
  )

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur-md sm:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenNav} aria-label="Open navigation">
        <Menu />
      </Button>

      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        <span className="truncate text-[12.5px] font-medium">{organization.name}</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={onOpenSearch}
          className="hidden h-8 w-[240px] items-center gap-2 rounded-md border border-border bg-card px-2.5 text-left text-[12px] text-muted-foreground transition-colors hover:border-[#cfdad2] md:flex xl:w-[300px]"
        >
          <Search className="size-3.5" />
          <span className="flex-1 truncate">Search farms, fields, findings…</span>
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[9.5px]">⌘K</kbd>
        </button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSearch} aria-label="Search">
          <Search />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#b7791f] ring-2 ring-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[320px] p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-[12px] font-medium">Notifications</span>
              <Badge tone="warning">{notifications.length} new</Badge>
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {notifications.map((event) => {
                const field = getField(event.fieldId)
                return (
                  <li key={event.id}>
                    <Link
                      to={event.fieldId ? `/fields/${event.fieldId}?tab=history` : "/drone"}
                      className="block px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-1 size-1.5 shrink-0 rounded-full",
                            event.kind === "system" ? "bg-danger" : event.kind === "report" ? "bg-info" : "bg-[#5b8c6e]",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium">{event.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                            {field ? `${field.name} · ` : ""}
                            {event.detail}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground/80">{relativeTime(event.at)}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="border-t p-1">
              <DropdownMenuItem onSelect={() => navigate("/reports")} className="justify-center text-muted-foreground">
                View activity history
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="secondary" size="sm" className="hidden gap-1.5 sm:inline-flex" onClick={onOpenAssistant}>
          <Sparkles className="text-primary" />
          Ask Seagle
        </Button>

        <Button size="sm" onClick={() => navigate("/drone?upload=1")} className="gap-1.5">
          <Plus />
          <span className="hidden sm:inline">New inspection</span>
          <span className="sm:hidden">Inspect</span>
        </Button>
      </div>
    </header>
  )
}
