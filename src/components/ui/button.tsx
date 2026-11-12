import type { ComponentProps } from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

// Registry-derived shadcn Button, with compatibility aliases and touch sizing.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-normal text-center transition-[color,background-color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "border border-border bg-secondary text-secondary-foreground shadow-xs hover:bg-accent",
        outline:
          "border border-input bg-input-surface shadow-xs hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        circle:
          "rounded-full border border-border bg-secondary text-secondary-foreground shadow-xs hover:bg-accent",
        destructive:
          "bg-danger-ground text-destructive hover:bg-danger-ground/80",
        danger: "bg-danger-ground text-destructive hover:bg-danger-ground/80",
        success:
          "bg-[var(--positive)] text-[var(--solid)] shadow-sm hover:opacity-90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-10 px-3 py-2 text-sm",
        lg: "min-h-12 px-6 py-3",
        icon: "size-11 p-2.5",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  loading = false,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Component = asChild ? Slot.Root : "button";
  return (
    <Component
      type={asChild ? undefined : type}
      data-slot="button"
      data-variant={variant ?? "primary"}
      data-size={size ?? "default"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <LoaderCircle className="wallet-loading-icon" aria-hidden="true" />
          )}
          {children}
        </>
      )}
    </Component>
  );
}
