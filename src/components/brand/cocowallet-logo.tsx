import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function CocoWalletLogo({
  className,
  "aria-hidden": ariaHidden,
  ...props
}: ComponentProps<"svg">) {
  const decorative = ariaHidden === true || ariaHidden === "true";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="360"
      height="72"
      viewBox="0 0 360 72"
      fill="none"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "CocoWallet"}
      aria-hidden={ariaHidden}
      focusable="false"
      {...props}
      data-slot="brand-logo"
      className={cn("cocowallet-logo", className)}
    >
      <rect x="4" y="4" width="64" height="64" rx="20" fill="#405e87" />
      <path
        d="M50 22H34C24.6 22 18 27.6 18 36S24.6 50 34 50H50"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M50 31H42a5 5 0 0 0 0 10h8"
        stroke="#a7c4e9"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="50" cy="36" r="2" fill="#ffffff" />
      <g
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M107 26c-2.5-3.7-5.6-5.5-9.5-5.5C90.3 20.5 86 26.6 86 35.5S90.3 50.5 97.5 50.5c3.9 0 7-1.8 9.5-5.5" />
        <ellipse cx="125" cy="40" rx="10" ry="10.5" />
        <path d="M160 33c-2-2.3-4.4-3.5-7.5-3.5-5.7 0-9.5 4.3-9.5 10.5s3.8 10.5 9.5 10.5c3.1 0 5.5-1.2 7.5-3.5" />
        <ellipse cx="179" cy="40" rx="10" ry="10.5" />
        <path d="m201 22 7 28 8-23 8 23 7-28" />
        <ellipse cx="249" cy="40" rx="10" ry="10.5" />
        <path d="M259 29.5v21M271 22v21.5c0 4.7 1.8 7 6 7M287 22v21.5c0 4.7 1.8 7 6 7" />
        <path d="M306 40h20c0-6.4-3.8-10.5-9.5-10.5-6.3 0-10.5 4.3-10.5 10.5s4.2 10.5 10.5 10.5c3.8 0 6.8-1.5 9-4" />
        <path d="M340 24v19.5c0 4.7 2.1 7 6.5 7M333 31h15" />
      </g>
    </svg>
  );
}
