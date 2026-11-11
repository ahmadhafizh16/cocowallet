import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns a healthy JSON response without caching mutable app state", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });
});
