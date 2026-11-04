import * as React from "react"
import { useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { CommandSearch } from "./CommandSearch"
import { AssistantPanel } from "@/components/assistant/AssistantPanel"
import { Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileNav, setMobileNav] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [assistantOpen, setAssistantOpen] = React.useState(false)
  const mainRef = React.useRef<HTMLElement>(null)
  const location = useLocation()

  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
    setMobileNav(false)
  }, [location.pathname, location.search])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh w-full overflow-hidden bg-background">
        <aside
          className={cn(
            "hidden shrink-0 border-r transition-[width] duration-200 lg:block",
            collapsed ? "w-[68px]" : "w-[240px]",
          )}
        >
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        </aside>

        <Sheet open={mobileNav} onOpenChange={setMobileNav}>
          <SheetContent side="left" width="260px" className="p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar collapsed={false} onToggle={() => setMobileNav(false)} onNavigate={() => setMobileNav(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-6 sm:px-6">{children}</div>
          </main>
        </div>

        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed right-5 bottom-5 z-30 flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-[12px] font-medium shadow-[0_10px_30px_rgba(16,24,20,0.16)] transition-colors hover:bg-muted"
        >
          <Sparkles className="size-3.5 text-primary" />
          Ask Seagle
        </button>

        <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <AssistantPanel open={assistantOpen} onOpenChange={setAssistantOpen} />
      </div>
    </TooltipProvider>
  )
}
