import { cn } from "./utils";

describe("cn", () => {
  it("combines conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("px-2", false, { "font-medium": true }, "px-4")).toBe(
      "font-medium px-4",
    );
  });
});
