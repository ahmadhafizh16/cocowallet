import {
  amountContract,
  currencyContract,
  identifierContract,
  objectContract,
  textContract,
  uuidContract,
} from "./contracts";
import {
  fundingRequestContract,
  validFundingInput,
} from "../features/funding/contracts";
import {
  conversionRequestContract,
  isConversionRequest,
} from "../features/conversions/contracts";
import {
  conversionQuoteRequestContract,
  isQuoteRequest,
  transferQuoteRequestContract,
} from "../features/quotes/contracts";
import {
  isTransferRequest,
  transferRequestContract,
} from "../features/transfers/contracts";
import { readApiDocument } from "../server/http/openapi";
import { matchesContract } from "../test/json-contract";

describe("shared contract definitions", () => {
  it.each(["__proto__", "constructor", " recipient ", "وجهة-💰", "a\nb"])(
    "retains exact arbitrary nonblank identifier %s",
    (id) => {
      expect(identifierContract.is(id)).toBe(true);
      expect(matchesContract(id, identifierContract.schema)).toBe(true);
    },
  );
  it.each([null, 1, "", " \n\t", "\0", "a\0b", "x".repeat(8193)])(
    "rejects invalid identifier %j",
    (id) => expect(identifierContract.is(id)).toBe(false),
  );
  it("retains the existing UTF-16 code-unit length limit for identifiers", () => {
    expect(identifierContract.is("💰".repeat(4096))).toBe(true);
    expect(identifierContract.is("💰".repeat(4097))).toBe(false);
  });
  it.each(["0", "0.00", "1", "1.00", "92233720368547758.08"])(
    "does not preempt business range/precision checks for %s",
    (amount) => expect(amountContract.is(amount)).toBe(true),
  );
  it.each([
    1,
    "01",
    "1e2",
    "-1",
    "+1",
    ".1",
    "1.",
    "1\n",
    "1.00\r\n",
    " 1",
    "1 ",
    "1".repeat(25),
  ])("rejects non-plain amount %j", (amount) =>
    expect(amountContract.is(amount)).toBe(false),
  );
  it.each(["USD\n", "usd", "USDD", "US", " USD"])(
    "rejects invalid currency syntax %j",
    (code) => expect(currencyContract.is(code)).toBe(false),
  );
  it.each([
    "12345678-1234-4123-8123-123456789ABC",
    "12345678-1234-8123-a123-123456789012",
  ])("retains case-insensitive standard UUID %s", (id) =>
    expect(uuidContract.is(id)).toBe(true),
  );
  it("rejects inherited, unknown and explicitly undefined optional fields", () => {
    const contract = objectContract(
      { id: identifierContract, note: textContract({}) },
      ["note"],
    );
    expect(contract.is({ id: "a" })).toBe(true);
    expect(contract.is({ id: "a", note: "" })).toBe(true);
    expect(contract.is(Object.create({ id: "a" }))).toBe(false);
    expect(contract.is({ id: "a", note: undefined })).toBe(false);
    expect(contract.is(JSON.parse('{"id":"a","__proto__":"extra"}'))).toBe(
      false,
    );
    expect(
      matchesContract({ id: "a", constructor: "extra" }, contract.schema),
    ).toBe(false);
  });
  it("publishes the same runtime request schema objects rather than divergent copies", () => {
    const schemas = readApiDocument.components.schemas;
    expect(schemas.FundingRequest).toBe(fundingRequestContract.schema);
    expect(schemas.ConversionRequest).toBe(conversionRequestContract.schema);
    expect(schemas.ConversionQuoteRequest).toBe(
      conversionQuoteRequestContract.schema,
    );
    expect(schemas.TransferQuoteRequest).toBe(
      transferQuoteRequestContract.schema,
    );
    expect(schemas.TransferRequest).toBe(transferRequestContract.schema);
  });
  it("keeps service guards aligned with structural schemas without normalization", () => {
    const funding = {
        walletId: " wallet ",
        amount: "1.00",
        provider: "demo_bank",
      },
      conversion = {
        quoteId: "12345678-1234-4123-8123-123456789012",
        sourceWalletId: " wallet ",
        amount: "1.00",
        targetCurrency: "GBP",
      };
    const pairs = [
      [funding, validFundingInput, fundingRequestContract.schema],
      [conversion, isConversionRequest, conversionRequestContract.schema],
      [
        {
          operation: "conversion",
          sourceWalletId: "wallet",
          amount: "1",
          targetCurrency: "GBP",
        },
        isQuoteRequest,
        conversionQuoteRequestContract.schema,
      ],
      [
        {
          operation: "transfer",
          sourceWalletId: "wallet",
          recipientAccountId: "recipient",
          amount: "1",
          targetCurrency: "GBP",
        },
        isQuoteRequest,
        transferQuoteRequestContract.schema,
      ],
      [
        {
          sourceWalletId: "wallet",
          recipientAccountId: "recipient",
          amount: "1",
        },
        isTransferRequest,
        transferRequestContract.schema,
      ],
    ] as const;
    for (const [input, guard, schema] of pairs)
      for (const candidate of [
        input,
        { ...input, amount: 1 },
        { ...input, amount: "1\n" },
        { ...input, unknown: true },
        { ...input, sourceWalletId: undefined },
      ])
        expect(guard(candidate)).toBe(matchesContract(candidate, schema));
  });
});
