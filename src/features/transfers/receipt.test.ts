import { randomUUID } from "node:crypto";
import { createJournalFixture } from "../../server/db/test-fixture";
import { submitFunding } from "../funding/service";
import { createQuote } from "../quotes/service";
import { submitTransfer } from "./service";
import { confirmedTransferResult } from "./receipt";
import type { TransferReceipt, TransferRequest } from "./contracts";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
type Mutation = [string, (receipt: TransferReceipt) => void];
const mutations: Mutation[] = [
  [
    "request key",
    (r) => {
      r.requestKey = randomUUID();
    },
  ],
  [
    "transaction ID",
    (r) => {
      r.transactionId = randomUUID();
    },
  ],
  [
    "source wallet",
    (r) => {
      r.source.walletId = "other-wallet";
    },
  ],
  [
    "recipient account",
    (r) => {
      r.target.accountId = "other-recipient";
    },
  ],
  [
    "own account",
    (r) => {
      r.source.accountId = r.target.accountId;
    },
  ],
  [
    "same wallet",
    (r) => {
      r.target.walletId = r.source.walletId;
    },
  ],
  [
    "target currency",
    (r) => {
      r.target.currency = "JPY";
    },
  ],
  [
    "recipient binding",
    (r) => {
      r.recipient.accountId = "other-recipient";
    },
  ],
  [
    "default precision",
    (r) => {
      r.recipient.defaultExponent = 0;
    },
  ],
  [
    "default name",
    (r) => {
      r.recipient.defaultName = "\0";
    },
  ],
  [
    "creation flag",
    (r) => {
      r.recipient.created = true;
    },
  ],
  [
    "source precision",
    (r) => {
      r.source.exponent = 0;
    },
  ],
  [
    "source amount",
    (r) => {
      r.source.amountMinor = "999";
    },
  ],
  [
    "target amount",
    (r) => {
      r.target.amountMinor = "999";
    },
  ],
  [
    "noncanonical amount",
    (r) => {
      r.target.amount = "10";
    },
  ],
  [
    "negative balance",
    (r) => {
      r.source.balanceMinor = "-1";
    },
  ],
  [
    "source prior overflow",
    (r) => {
      r.source.balanceMinor = "9223372036854775807";
    },
  ],
  [
    "target prior underflow",
    (r) => {
      r.target.balanceMinor = "0";
    },
  ],
  [
    "invalid timestamp",
    (r) => {
      r.createdAt = "invalid";
    },
  ],
];

describe("retained transfer receipt validation", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
    expect(
      submitFunding(fixture.database, "deposit", randomUUID(), {
        walletId: "main-usd",
        amount: "100.00",
        provider: "demo_bank",
      }).status,
    ).toBe(200);
  });
  afterEach(() => fixture.cleanup());

  async function receipt(fx: boolean) {
    const input: TransferRequest = {
      sourceWalletId: "main-usd",
      recipientAccountId: "recipient",
      targetCurrency: fx ? "GBP" : "USD",
      amount: "10.00",
    };
    if (fx) {
      const { quote } = await createQuote(
        fixture.database,
        { ...input, targetCurrency: "GBP", operation: "transfer" },
        {
          now: () => NOW,
          client: {
            catalog: async () => ({
              currencies: [
                { code: "USD", name: "Dollar", exponent: 2 },
                { code: "GBP", name: "Pound", exponent: 2 },
              ],
              fetchedAt: new Date(NOW).toISOString(),
            }),
            rate: async () => ({
              rate: "0.8",
              date: "2026-11-11",
              fetchedAt: new Date(NOW).toISOString(),
            }),
          },
        },
      );
      input.quoteId = quote.quoteId;
    }
    const key = randomUUID(),
      result = await submitTransfer(fixture.database, key, input, {
        now: () => NOW,
      });
    expect(result.status).toBe(200);
    const body = result.body as TransferReceipt;
    return { input, key, body, transactionId: body.transactionId };
  }

  it.each(mutations)(
    "rejects corrupted %s without depending on current state",
    async (_label, mutate) => {
      const { input, key, body, transactionId } = await receipt(false);
      mutate(body);
      expect(() =>
        confirmedTransferResult(body, "200", transactionId, key, input),
      ).toThrow();
    },
  );

  it.each(["quoteId", "rate", "issuedAt", "expiresAt"] as const)(
    "requires explicit null %s for a same-currency receipt",
    async (field) => {
      const { input, key, body, transactionId } = await receipt(false);
      const altered = { ...body, [field]: undefined };
      expect(() =>
        confirmedTransferResult(altered, "200", transactionId, key, input),
      ).toThrow();
    },
  );

  const fxMutations: Mutation[] = [
    [
      "quote ID",
      (r) => {
        r.quoteId = randomUUID();
      },
    ],
    [
      "missing rate",
      (r) => {
        Object.assign(r, { rate: null });
      },
    ],
    [
      "rate arithmetic",
      (r) => {
        r.rate!.value = "0.9";
      },
    ],
    [
      "rate source",
      (r) => {
        Object.assign(r.rate!, { source: "invented" });
      },
    ],
    [
      "rate provider",
      (r) => {
        Object.assign(r.rate!, { provider: "invented" });
      },
    ],
    [
      "rate fetched time",
      (r) => {
        r.rate!.fetchedAt = "invalid";
      },
    ],
    [
      "rate source date",
      (r) => {
        r.rate!.date = "2026-11-13";
      },
    ],
    [
      "quote lifetime",
      (r) => {
        r.expiresAt = new Date(NOW + 59000).toISOString();
      },
    ],
    [
      "quote issuance",
      (r) => {
        r.issuedAt = "invalid";
      },
    ],
  ];
  it.each(fxMutations)("rejects corrupted FX %s", async (_label, mutate) => {
    const { input, key, body, transactionId } = await receipt(true);
    mutate(body);
    expect(() =>
      confirmedTransferResult(body, "200", transactionId, key, input),
    ).toThrow();
  });

  it("rejects a damaged retained business rejection", async () => {
    const input: TransferRequest = {
        sourceWalletId: "main-usd",
        recipientAccountId: "main",
        amount: "10.00",
      },
      key = randomUUID();
    const result = await submitTransfer(fixture.database, key, input);
    expect(result.status).toBe(400);
    expect(
      confirmedTransferResult(result.body, "400", null, key, input),
    ).toEqual(result.body);
    for (const changed of [
      { ...result.body, definitive: false },
      { ...result.body, code: "unknown" },
      { ...result.body, detail: "private path" },
    ])
      expect(() =>
        confirmedTransferResult(changed, "400", null, key, input),
      ).toThrow();
    expect(() =>
      confirmedTransferResult(result.body, "409", null, key, input),
    ).toThrow();
    expect(() =>
      confirmedTransferResult(result.body, "400", randomUUID(), key, input),
    ).toThrow();
  });
});
