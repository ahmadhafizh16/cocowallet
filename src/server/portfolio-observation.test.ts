import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { createJournalFixture } from "./db/test-fixture";
import { submitFunding } from "@/features/funding/service";
import { observeCompletedSubmission } from "./portfolio-observation";

jest.mock("server-only", () => ({}));
jest.mock("next/server", () => ({ after: jest.fn() }));
it("defers snapshot work until after success, and never adds work to original-result replay", async () => {
  const fixture = createJournalFixture();
  try {
    jest.mocked(after).mockClear();
    const key = randomUUID(),
      input = { walletId: "main-usd", amount: "1.00", provider: "demo_bank" };
    const result = submitFunding(fixture.database, "deposit", key, input);
    observeCompletedSubmission(fixture.database, result);
    expect(after).toHaveBeenCalledTimes(1);
    const callback = jest.mocked(after).mock
      .calls[0]![0] as () => Promise<void>;
    await callback();
    expect(
      fixture.database.sqlite
        .prepare("SELECT total_usd_minor FROM portfolio_snapshots")
        .get(),
    ).toEqual({ total_usd_minor: 100n });
    observeCompletedSubmission(
      fixture.database,
      submitFunding(fixture.database, "deposit", key, input),
    );
    expect(after).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(200);
  } finally {
    fixture.cleanup();
  }
});
it("cannot turn confirmed success into an error if scheduling fails", () => {
  const fixture = createJournalFixture();
  try {
    jest.mocked(after).mockImplementationOnce(() => {
      throw new Error("no request scope");
    });
    const result = submitFunding(fixture.database, "deposit", randomUUID(), {
      walletId: "main-usd",
      amount: "1.00",
      provider: "demo_bank",
    });
    expect(() =>
      observeCompletedSubmission(fixture.database, result),
    ).not.toThrow();
    expect(result.status).toBe(200);
  } finally {
    fixture.cleanup();
  }
});
