import * as React from "react"
import { cn } from "@/lib/utils"

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full min-w-0 rounded-md border border-input bg-card px-2.5 py-1 text-[13px] shadow-[0_1px_1px_rgba(16,24,20,0.03)] transition-colors outline-none placeholder:text-muted-foreground/80 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
