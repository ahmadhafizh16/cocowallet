"use client";
import { useEffect, type RefObject } from "react";
import type { useConversionQuote } from "./use-quote";
import type { OperationReview } from "../wallet/operation-model";
import { MoneyReview, ReviewWallet } from "../wallet/money-review";
import { CurrencyFlag } from "../wallet/currency-flag";
import { displayAmount } from "../wallet/presentation";
import { QuoteDetails } from "./quote-details";

export function ConversionQuoteReview({
  preview,
  review,
  hidden,
  ready,
  heading,
  onConfirm,
  onEdit,
  onClose,
  accountId,
}: {
  preview: ReturnType<typeof useConversionQuote>;
  review: OperationReview;
  hidden: boolean;
  ready: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
  accountId: string;
}) {
  const quote = preview.quote;
  useEffect(() => {
    heading.current?.focus();
  }, [heading, preview.pending, quote, preview.message]);
  return (
    <MoneyReview
      title="Review conversion"
      heading={heading}
      amount={displayAmount(review.minor, review.wallet.exponent)}
      currency={review.wallet.currency}
      hidden={hidden}
      disabled={!quote || preview.pending || preview.expired || !ready}
      confirmLabel="Confirm conversion"
      onConfirm={onConfirm}
      onEdit={onEdit}
      onCancel={onClose}
      source={
        <ReviewWallet currency={review.wallet.currency} id={review.wallet.id} />
      }
      targetLabel="You receive"
      target={
        <div className="wallet-review-identity">
          <span className="wallet-review-currency">
            <CurrencyFlag currency={review.targetCurrency} />
          </span>
          <span>
            {hidden
              ? "Amount hidden"
              : quote
                ? `${displayAmount(BigInt(quote.target.amountMinor), quote.target.exponent)} ${quote.target.currency}`
                : "Waiting for a rate"}
          </span>
          <span className="wallet-review-id">
            {review.targetCurrency} Balance Wallet
          </span>
        </div>
      }
    >
      <QuoteDetails preview={preview} hidden={hidden} accountId={accountId} />
    </MoneyReview>
  );
}
