import * as React from "react"
import { cn } from "@/lib/utils"

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-cyan-100 text-cyan-800",
    outline: "border border-slate-200 text-slate-800",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
