import { renderToStaticMarkup } from "react-dom/server";
import { SubmissionPanel } from "./submission-panel";
import type { useSubmission } from "./use-submission";

const intent = {
  version: 1 as const,
  kind: "deposit" as const,
  key: "11111111-1111-4111-8111-111111111111",
  request: { walletId: "usd", amount: "10.00", provider: "demo_bank" as const },
};
const receipt = {
  requestKey: intent.key,
  transactionId: "record",
  type: "deposit" as const,
  status: "completed" as const,
  accountId: "main",
  walletId: "usd",
  currency: "USD",
  exponent: 2,
  amountMinor: "1000",
  balanceMinor: "1000",
  provider: "demo_bank" as const,
  createdAt: "2026-11-12T12:00:00.000Z",
};
const funding: ReturnType<typeof useSubmission> = {
  ready: true,
  pending: false,
  storageBlocked: false,
  intent,
  result: receipt,
  send: async () => {},
  startAnother: () => {},
};
it("shows a concise green-check success and no recovery key, quote, timestamp or post-balance facts", () => {
  const html = renderToStaticMarkup(
    <SubmissionPanel
      funding={funding}
      hidden={false}
      onClose={() => {}}
      onAnother={() => {}}
    />,
  );
  expect(html).toContain("wallet-success-check");
  expect(html).toContain("Deposit complete");
  expect(html).toContain("10.00 USD");
  expect(html).not.toMatch(
    /Retry key|Quote ID|Transaction ID|Balance after|<time|11111111|Recorded at/u,
  );
});
it("removes confirmed monetary data in private success", () => {
  const html = renderToStaticMarkup(
    <SubmissionPanel
      funding={funding}
      hidden
      onClose={() => {}}
      onAnother={() => {}}
    />,
  );
  expect(html).toContain("Deposit complete");
  expect(html).not.toMatch(/10\.00|1000|2026-11-12/u);
});
it("retains original-key recovery rather than claiming success for an unknown outcome", () => {
  const html = renderToStaticMarkup(
    <SubmissionPanel
      funding={{ ...funding, result: undefined }}
      hidden={false}
      onClose={() => {}}
      onAnother={() => {}}
    />,
  );
  expect(html).toContain("Retry original submission");
  expect(html).toContain(intent.key);
  expect(html).not.toContain("wallet-success-check");
});
