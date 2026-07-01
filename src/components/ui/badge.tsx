import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "sun";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-xs font-bold tracking-wide transition-colors",
        variant === "default" && "bg-country-hover/80 text-ink",
        variant === "sun" && "bg-sun text-ink shadow-sticker",
        variant === "outline" && "border-2 border-ink/15 text-ink-soft",
        className
      )}
      {...props}
    />
  );
}
