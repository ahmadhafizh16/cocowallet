import { fundingProblem, type FundingProblem } from "../funding/contracts";
import { conversionFailures } from "../conversions/contracts";
import { type StoredQuote } from "../quotes/contracts";
import {
  amountContract,
  currencyContract,
  identifierContract,
  objectContract,
  uuidContract,
} from "../../lib/contracts";

export type TransferRequest = {
  sourceWalletId: string;
  recipientAccountId: string;
  amount: string;
  targetCurrency?: string;
  recipientDefaultCurrency?: string;
  quoteId?: string;
};
type Side = StoredQuote["source"] & { balanceMinor: string };
export type TransferReceipt = {
  requestKey: string;
  transactionId: string;
  type: "transfer";
  status: "completed";
  source: Side;
  target: Side;
  recipient: {
    accountId: string;
    defaultCurrency: string;
    defaultName: string;
    defaultExponent: number;
    created: boolean;
  };
  createdAt: string;
} & (
  | {
      quoteId: string;
      rate: StoredQuote["rate"];
      issuedAt: string;
      expiresAt: string;
    }
  | { quoteId: null; rate: null; issuedAt: null; expiresAt: null }
);
export type TransferResult = {
  status: 200 | FundingProblem["status"];
  body: TransferReceipt | FundingProblem;
  replayed: boolean;
};
export const transferProblem = fundingProblem;
export const transferFailures = {
  ...conversionFailures,
  QUOTE_NOT_FOUND: {
    status: 404,
    detail: "The requested quote does not exist. No transfer was completed.",
  },
  SOURCE_WALLET_NOT_FOUND: {
    status: 404,
    detail: "The source wallet does not exist. No transfer was completed.",
  },
  INSPECT_ONLY: {
    status: 409,
    detail: "Only the main account can initiate a transfer.",
  },
  INSUFFICIENT_FUNDS: {
    status: 409,
    detail:
      "The source wallet has insufficient funds. No transfer was completed.",
  },
  BALANCE_OUT_OF_RANGE: {
    status: 409,
    detail:
      "The target credit would exceed the supported wallet balance. No transfer was completed.",
  },
  INVALID_RECIPIENT: {
    status: 400,
    detail:
      "Choose a different simulated destination, not the main account. Use Convert for own-wallet currency changes.",
  },
  RECIPIENT_DEFAULT_REQUIRED: {
    status: 400,
    detail: "Choose the default currency for this new simulated recipient.",
  },
  RECIPIENT_CONTEXT_CHANGED: {
    status: 409,
    detail:
      "The recipient's recorded default differs from this request. Refresh and review its current context.",
  },
  INVALID_TARGET_CURRENCY: {
    status: 400,
    detail: "Choose an eligible fiat target and recipient default currency.",
  },
  INVALID_AMOUNT: {
    status: 400,
    detail: "Enter a positive plain-decimal transfer amount.",
  },
  INVALID_PRECISION: {
    status: 400,
    detail: "The amount exceeds the source currency's accounting precision.",
  },
  AMOUNT_OUT_OF_RANGE: {
    status: 400,
    detail: "The amount exceeds the supported monetary range.",
  },
  FX_QUOTE_REQUIRED: {
    status: 400,
    detail:
      "Review a server-owned quote before confirming a cross-currency transfer.",
  },
  FX_QUOTE_NOT_REQUIRED: {
    status: 400,
    detail:
      "Same-currency transfers require no FX quote. Do not attach a different operation's quote.",
  },
} as const;
export class TransferError extends Error {
  readonly status: 400 | 404 | 409;
  constructor(public readonly code: keyof typeof transferFailures) {
    super(code);
    this.name = "TransferError";
    this.status = transferFailures[code].status;
  }
}
export const transferRequestContract = objectContract(
  {
    sourceWalletId: identifierContract,
    recipientAccountId: identifierContract,
    amount: amountContract,
    targetCurrency: currencyContract,
    recipientDefaultCurrency: currencyContract,
    quoteId: uuidContract,
  },
  ["targetCurrency", "recipientDefaultCurrency", "quoteId"],
);
export function isTransferRequest(value: unknown): value is TransferRequest {
  return transferRequestContract.is(value);
}
export function canonicalTransferRequest(input: TransferRequest): string {
  return JSON.stringify([
    "transfer",
    input.sourceWalletId,
    input.recipientAccountId,
    input.amount,
    input.targetCurrency ?? null,
    input.recipientDefaultCurrency ?? null,
    input.quoteId ?? null,
  ]);
}
