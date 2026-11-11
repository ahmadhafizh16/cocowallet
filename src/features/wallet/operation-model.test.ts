import { MAX_MINOR } from "../money/money";
import {
  createDraft,
  PROVIDERS,
  validateOperation,
  type Operation,
} from "./operation-model";
import { createPreviewOverview } from "./types";

describe("preview operation validation", () => {
  const model = createPreviewOverview();
  const account = model.accounts[0]!;
  const usd = model.wallets[0]!;
  const draft = {
    ...createDraft(model.wallets, "USD"),
    amount: "12.34",
    recipient: "simulated-destination",
  };

  it("reviews an exact deposit without a mutation or fabricated outcome", () => {
    const result = validateOperation({
      operation: "deposit",
      draft,
      account,
      wallets: model.wallets,
    });
    expect(result.errors).toEqual({});
    expect(result.review?.minor).toBe(1234n);
    expect(model.wallets.every((wallet) => wallet.balanceMinor === "0")).toBe(
      true,
    );
    expect(model.transactions).toEqual([]);
    expect(draft.amount).toBe("12.34");
  });

  it.each<Operation>(["withdraw", "convert", "transfer"])(
    "blocks %s against the zero preview balance",
    (operation) => {
      const result = validateOperation({
        operation,
        draft,
        account,
        wallets: model.wallets,
      });
      expect(result.review).toBeNull();
      expect(result.errors.amount).toMatch(/Insufficient preview balance/u);
    },
  );

  it.each([
    "0",
    "-1",
    "01",
    "1,000",
    " 1.00",
    "1e2",
    "1.001",
    "1.000",
    "9".repeat(25),
  ])("rejects noncanonical or unsupported amount %s", (amount) => {
    const result = validateOperation({
      operation: "deposit",
      draft: { ...draft, amount },
      account,
      wallets: model.wallets,
    });
    expect(result.review).toBeNull();
    expect(result.errors.amount).toBeTruthy();
  });

  it("enforces main-only actions even if a client attempts validation directly", () => {
    const result = validateOperation({
      operation: "deposit",
      draft,
      account: { ...account, role: "destination" },
      wallets: model.wallets,
    });
    expect(result.review).toBeNull();
    expect(result.errors.form).toMatch(/inspect-only/u);
  });

  it("does not invent a source wallet or make an invalid balance spendable", () => {
    expect(
      validateOperation({ operation: "deposit", draft, account, wallets: [] })
        .errors.currency,
    ).toBeTruthy();
    expect(
      validateOperation({
        operation: "deposit",
        draft,
        account,
        wallets: [{ ...usd, balanceMinor: "invalid" }],
      }).errors.amount,
    ).toMatch(/unavailable/u);
  });

  it("accepts only the three explicitly fictional providers", () => {
    expect(PROVIDERS.map((provider) => provider.code)).toEqual([
      "demo_bank",
      "community_bank",
      "crypto_gateway",
    ]);
    expect(
      validateOperation({
        operation: "deposit",
        draft: { ...draft, provider: "real-bank" },
        account,
        wallets: model.wallets,
      }).errors.provider,
    ).toBeTruthy();
  });

  it("requires a distinct bounded recipient ID without claiming to verify it", () => {
    for (const recipient of [
      "",
      "a",
      "a b",
      "a".repeat(129),
      "recipient\n",
      "recipient\r\n",
      account.id,
    ]) {
      expect(
        validateOperation({
          operation: "transfer",
          draft: { ...draft, recipient },
          account,
          wallets: model.wallets,
        }).errors.recipient,
      ).toBeTruthy();
    }
  });

  it("requires different conversion currencies and never returns a rate", () => {
    const wallets = [
      { ...usd, balanceMinor: "5000" },
      ...model.wallets.slice(1),
    ];
    expect(
      validateOperation({
        operation: "convert",
        draft: { ...draft, targetCurrency: "USD" },
        account,
        wallets,
      }).errors.targetCurrency,
    ).toBeTruthy();
    const result = validateOperation({
      operation: "convert",
      draft,
      account,
      wallets,
    });
    expect(result.review?.minor).toBe(1234n);
    expect(result.review).not.toHaveProperty("rate");
    expect(result.review).not.toHaveProperty("receiveMinor");
  });

  it("checks the final deposit balance bound with exact integers", () => {
    const wallets = [{ ...usd, balanceMinor: MAX_MINOR.toString() }];
    expect(
      validateOperation({
        operation: "deposit",
        draft: { ...draft, amount: "0.01" },
        account,
        wallets,
      }).errors.amount,
    ).toMatch(/exceed/u);
  });

  it("never validates another account’s source or target wallets", () => {
    const wallets = model.wallets.map((wallet) => ({
      ...wallet,
      accountId: "another-account",
      balanceMinor: "5000",
    }));
    const result = validateOperation({
      operation: "deposit",
      draft,
      account,
      wallets,
    });
    expect(result.errors.currency).toBeTruthy();
    expect(result.review).toBeNull();
    const mixedWallets = [
      { ...usd, balanceMinor: "5000" },
      ...wallets.slice(1),
    ];
    expect(
      validateOperation({
        operation: "convert",
        draft,
        account,
        wallets: mixedWallets,
      }).errors.targetCurrency,
    ).toBeTruthy();
  });
});
