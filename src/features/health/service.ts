export function getHealth() {
  return {
    status: "ok" as const,
    service: "simulated-wallet",
    milestone: "foundation" as const,
  };
}
