import { createJournalFixture } from "../../server/db/test-fixture";
import { journalEntries, transactions } from "../../server/db/schema";
import { withJournalWrite, type AppliedRate } from "../journal/write";
import type { FundingProvider } from "../funding/contracts";
import type { TransactionType } from "./contracts";

type Operation = {
  id: string;
  type: TransactionType;
  createdAt: string;
  sourceWalletId?: string;
  targetWalletId?: string;
  debit?: bigint;
  credit?: bigint;
  provider?: FundingProvider;
  rate?: AppliedRate;
};
/** Only isolated tests may build dated journal facts; never a runtime seed. */
export function createHistoryFixture() {
  const fixture = createJournalFixture();
  const add = (operation: Operation) =>
    fixture.database.sqlite
      .transaction(() => {
        fixture.database.db
          .insert(transactions)
          .values({
            id: operation.id,
            type: operation.type,
            createdAt: operation.createdAt,
            sourceWalletId: operation.sourceWalletId ?? null,
            targetWalletId: operation.targetWalletId ?? null,
            provider: operation.provider ?? null,
            rate: operation.rate?.value ?? null,
            rateDate: operation.rate?.date ?? null,
            rateFetchedAt: operation.rate?.fetchedAt ?? null,
            rateSource: operation.rate?.source ?? null,
          })
          .run();
        if (operation.sourceWalletId)
          fixture.database.db
            .insert(journalEntries)
            .values({
              transactionId: operation.id,
              walletId: operation.sourceWalletId,
              amountMinor: -operation.debit!,
            })
            .run();
        if (operation.targetWalletId)
          fixture.database.db
            .insert(journalEntries)
            .values({
              transactionId: operation.id,
              walletId: operation.targetWalletId,
              amountMinor: operation.credit!,
            })
            .run();
      })
      .immediate();
  try {
    withJournalWrite(fixture.database, (scope) => {
      scope.createDestination({ id: "other", defaultCurrency: "USD" });
      scope.createWallet({
        id: "other-usd",
        accountId: "other",
        currencyCode: "USD",
      });
    });
    add({
      id: "deposit-old",
      type: "deposit",
      targetWalletId: "main-usd",
      credit: 100000n,
      provider: "demo_bank",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    add({
      id: "deposit-before",
      type: "deposit",
      targetWalletId: "main-usd",
      credit: 1000n,
      provider: "community_bank",
      createdAt: "2026-11-11T23:59:59.999Z",
    });
    add({
      id: "deposit-start",
      type: "deposit",
      targetWalletId: "main-usd",
      credit: 1000n,
      provider: "demo_bank",
      createdAt: "2026-11-12T00:00:00.000Z",
    });
    add({
      id: "withdraw-middle",
      type: "withdrawal",
      sourceWalletId: "main-usd",
      debit: 123n,
      provider: "crypto_gateway",
      createdAt: "2026-11-12T12:00:00.000Z",
    });
    add({
      id: "conversion-tie-a",
      type: "conversion",
      sourceWalletId: "main-usd",
      targetWalletId: "main-gbp",
      debit: 100n,
      credit: 81n,
      rate: {
        value: "0.805",
        date: "2026-10-31",
        fetchedAt: "2026-11-01T10:00:00.000Z",
        source: "cached",
      },
      createdAt: "2026-11-12T12:00:00.000Z",
    });
    add({
      id: "transfer-tie-z",
      type: "transfer",
      sourceWalletId: "main-usd",
      targetWalletId: "recipient-gbp",
      debit: 100n,
      credit: 80n,
      rate: {
        value: "0.8000",
        date: "2026-11-10",
        fetchedAt: "2026-11-11T10:00:00.000Z",
        source: "fresh",
      },
      createdAt: "2026-11-12T12:00:00.000Z",
    });
    add({
      id: "transfer-same",
      type: "transfer",
      sourceWalletId: "main-usd",
      targetWalletId: "recipient-usd",
      debit: 500n,
      credit: 500n,
      createdAt: "2026-11-12T23:59:59.999Z",
    });
    add({
      id: "transfer-next",
      type: "transfer",
      sourceWalletId: "main-gbp",
      targetWalletId: "recipient-gbp",
      debit: 25n,
      credit: 25n,
      createdAt: "2026-11-13T00:00:00.000Z",
    });
    add({
      id: "transfer-other",
      type: "transfer",
      sourceWalletId: "main-usd",
      targetWalletId: "other-usd",
      debit: 700n,
      credit: 700n,
      createdAt: "2026-11-13T10:00:00.000Z",
    });
    return { ...fixture, add };
  } catch (error) {
    fixture.cleanup();
    throw error;
  }
}
