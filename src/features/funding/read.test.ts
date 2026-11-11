import { randomUUID } from "node:crypto";
import { createJournalFixture } from "../../server/db/test-fixture";
import { readRecentFunding } from "./read";
import { submitFunding } from "./service";

describe("bounded completed-funding visibility", () => {
  it("includes immutable successful receipts only, never rejected attempts", () => {
    const fixture = createJournalFixture();
    try {
      expect(readRecentFunding(fixture.database)).toEqual([]);
      submitFunding(fixture.database, "withdrawal", randomUUID(), {
        walletId: "main-usd",
        amount: "10",
        provider: "demo_bank",
      });
      const success = submitFunding(fixture.database, "deposit", randomUUID(), {
        walletId: "main-usd",
        amount: "10",
        provider: "crypto_gateway",
      });
      expect(readRecentFunding(fixture.database)).toEqual([success.body]);
      expect(JSON.stringify(readRecentFunding(fixture.database))).not.toContain(
        "INSUFFICIENT_FUNDS",
      );
    } finally {
      fixture.cleanup();
    }
  });
});
