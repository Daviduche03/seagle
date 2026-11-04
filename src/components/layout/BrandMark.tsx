import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#174B35" />
      <path d="M7 21.5c3.2-.4 5.6-2.1 7.2-4.9 1.2-2 1.9-4.2 2.3-6.6" stroke="#E8F0EA" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d="M9 24c3.6-.5 6.4-2.4 8.3-5.6 1.6-2.7 2.5-5.7 2.9-8.9" stroke="#E8F0EA" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M11.5 26.5c3.9-.6 7-2.8 9.1-6.4 1.8-3 2.8-6.3 3.2-9.9" stroke="#F7F9F7" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="23.6" cy="9.4" r="2.4" fill="#F7F9F7" />
    </svg>
  )
}
