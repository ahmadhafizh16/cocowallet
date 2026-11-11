import { createPreviewOverview } from "./types";

describe("interface-first presentation model", () => {
  it("labels presentation data as preview, not stored wallet state", () => {
    const model = createPreviewOverview();
    expect(model.mode).toBe("interface-preview");
    expect(model.accounts).toEqual([
      {
        id: "main-account",
        label: "Main account",
        role: "main",
        defaultCurrency: "USD",
      },
    ]);
    expect(model.wallets.map((wallet) => wallet.currency)).toEqual([
      "USD",
      "EUR",
      "GBP",
    ]);
    expect(model.wallets.every((wallet) => wallet.balanceMinor === "0")).toBe(
      true,
    );
    expect(
      model.wallets.every(
        (wallet) => wallet.accountId === model.activeAccountId,
      ),
    ).toBe(true);
    expect(model.transactions).toEqual([]);
    expect(() => JSON.stringify(model)).not.toThrow();
  });

  it("does not share mutable presentation state across requests", () => {
    const first = createPreviewOverview();
    first.accounts.splice(0);
    first.wallets.splice(0);
    const second = createPreviewOverview();
    expect(second.accounts).toHaveLength(1);
    expect(second.wallets).toHaveLength(3);
  });
});
