/** Presentation only: API/storage values and <time dateTime> remain canonical UTC. */
export function readableDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(date.getUTCFullYear() < 1 ? { era: "short" as const } : {}),
    timeZone: "UTC",
  }).format(date);
}

export function readableTime(value: string, compact = false): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", ...(date.getUTCFullYear() < 1 ? { era: "short" as const } : {}), hour: "numeric", minute: "2-digit", ...(compact ? {} : { second: "2-digit" as const }), hour12: true, timeZone: "UTC" }).format(date)} UTC`;
}
