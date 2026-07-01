import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-bold tracking-wide transition-all active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Hlavní CTA — hořčičková žlutá s tmavým textem (jako IG badge)
        default:
          "bg-sun text-ink shadow-sticker hover:bg-sun-light hover:-translate-y-0.5",
        outline:
          "border-2 border-ink/15 bg-paper-light text-ink hover:border-ink/30 hover:bg-country-hover/60",
        ghost: "text-ink hover:bg-country-hover/60",
        link: "text-sun-deep underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-8 py-3 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
