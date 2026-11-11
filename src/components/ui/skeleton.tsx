import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Decorative shape; the containing loading region supplies one status announcement. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("ui-skeleton rounded-md bg-accent", className)}
    />
  );
}
