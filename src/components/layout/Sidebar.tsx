import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronsUpDown, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { workspaceNav, type NavItem } from "@/lib/nav"
import { escalatedObservations, dueActions, team, getMember } from "@/data/store"
import { BrandMark } from "./BrandMark"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AccountDialog } from "./AccountDialog"

const currentUser = getMember(team[0].id)!

const row =
  "group relative flex h-[34px] w-full items-center gap-[11px] rounded-lg px-2 text-left text-[13px] leading-none font-[450] transition-colors"

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const location = useLocation()
  const [accountOpen, setAccountOpen] = React.useState(false)
  const counts = {
    attention: escalatedObservations().length,
    actions: dueActions().length,
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fbfcfb] select-none">
      <div className={cn("flex h-14 shrink-0 items-center", collapsed ? "justify-center px-0" : "px-3")}>
        <Link to="/" onClick={onNavigate} className="flex min-w-0 items-center gap-2" aria-label="Seagle home">
          <BrandMark className="size-[26px]" />
          {!collapsed && (
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm leading-none font-semibold tracking-[-0.015em]">Seagle</span>
              <span className="mt-[5px] truncate text-[10.5px] leading-none text-muted-foreground">Farm intelligence</span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto hidden text-muted-foreground/70 hover:text-foreground lg:inline-flex"
            onClick={onToggle}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose strokeWidth={1.75} />
          </Button>
        )}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-7 pb-2" aria-label="Main">
        <NavSection
          label="Workspace"
          items={workspaceNav}
          collapsed={collapsed}
          counts={counts}
          path={location.pathname}
          onNavigate={onNavigate}
        />

      </nav>

      <div className="shrink-0 border-t border-border/80 p-2.5">
        <button
          onClick={() => setAccountOpen(true)}
          aria-label="Account and workspace menu"
          className={cn(row, collapsed ? "justify-center px-0" : "px-2", "hover:bg-[#f1f5f2]")}
        >
          <Avatar name={currentUser.name} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] leading-tight font-[500]">{currentUser.name}</span>
                <span className="mt-[4px] block truncate text-[11px] leading-tight font-normal text-muted-foreground">
                  {currentUser.role}
                </span>
              </span>
              <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground/50" strokeWidth={1.75} />
            </>
          )}
        </button>

        {collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="mt-1 hidden w-full text-muted-foreground/70 lg:inline-flex"
            onClick={onToggle}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen strokeWidth={1.75} />
          </Button>
        )}
      </div>

      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
    </div>
  )
}

function NavSection({
  label,
  items,
  collapsed,
  counts,
  path,
  onNavigate,
}: {
  label: string
  items: NavItem[]
  collapsed: boolean
  counts: Record<NonNullable<NavItem["badge"]>, number>
  path: string
  onNavigate?: () => void
}) {
  return (
    <div>
      {!collapsed && (
        <p className="px-2 pb-3 text-[10.5px] font-[550] tracking-[0.085em] text-[#74817a] uppercase">{label}</p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = item.href === "/" ? path === "/" : path.startsWith(item.href)
          const count = item.badge ? counts[item.badge] : 0
          const content = (
            <Link
              to={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              style={active ? { fontWeight: 550 } : undefined}
              className={cn(
                row,
                active
                  ? "bg-[#e8f0ea] text-[#174b35]"
                  : "text-[#46534a] hover:bg-[#f1f5f2] hover:text-[#202923]",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon
                strokeWidth={1.75}
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-[#174b35]" : "text-[#6c7970] group-hover:text-[#3f4c44]",
                )}
              />
              {collapsed && count > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-2 right-2 size-1.5 rounded-full",
                    item.badge === "attention" ? "bg-[#b7791f]" : "bg-[#93a099]",
                  )}
                />
              )}
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "ml-auto flex h-[19px] min-w-[19px] items-center justify-center rounded-[5px] px-1 text-[10.5px] font-[500] tabular",
                        active
                          ? "bg-white text-[#174b35]"
                          : item.badge === "attention"
                            ? "bg-[#fbf0de] text-[#8f5710]"
                            : "bg-[#eef2ee] text-[#5d6b62]",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </Link>
          )

          if (!collapsed) return <li key={item.id}>{content}</li>

          return (
            <li key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.label}
                  {count > 0 && <span className="text-white/60 tabular">· {count}</span>}
                </TooltipContent>
              </Tooltip>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
