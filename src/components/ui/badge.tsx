import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variant === "default" && "bg-country-hover/70 text-ink",
        variant === "outline" && "border border-stroke/50 text-ink-soft",
        className
      )}
      {...props}
    />
  );
}
