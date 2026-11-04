import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"

export function Avatar({
  name,
  className,
  size = "default",
}: {
  name: string
  className?: string
  size?: "sm" | "default" | "lg"
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-[#cfe0d5] bg-[#e6efe8] font-medium text-[#25463a]",
        size === "sm" && "size-5 text-[9px]",
        size === "default" && "size-7 text-[10.5px]",
        size === "lg" && "size-9 text-[12px]",
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
