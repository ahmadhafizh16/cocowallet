"use client";
import { useEffect, type RefObject } from "react";
import { Send } from "lucide-react";
import type { useConversionQuote } from "../conversions/use-quote";
import type { OperationReview } from "../wallet/operation-model";
import { MoneyReview, ReviewWallet } from "../wallet/money-review";
import { displayAmount } from "../wallet/presentation";
import { QuoteDetails } from "../conversions/quote-details";

export function TransferReview({
  review,
  preview,
  hidden,
  ready,
  heading,
  onConfirm,
  onEdit,
  onClose,
}: {
  review: OperationReview;
  preview: ReturnType<typeof useConversionQuote>;
  hidden: boolean;
  ready: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const fx = review.wallet.currency !== review.targetCurrency,
    quote = fx ? preview.quote : undefined;
  useEffect(() => {
    heading.current?.focus();
  }, [heading, preview.pending, quote, preview.message]);
  const receives = hidden
    ? "Amount hidden"
    : fx
      ? quote
        ? `${displayAmount(BigInt(quote.target.amountMinor), quote.target.exponent)} ${quote.target.currency}`
        : "Waiting for a rate"
      : `${displayAmount(review.minor, review.wallet.exponent)} ${review.targetCurrency}`;
  return (
    <MoneyReview
      title="Review transfer"
      heading={heading}
      amount={displayAmount(review.minor, review.wallet.exponent)}
      currency={review.wallet.currency}
      hidden={hidden}
      disabled={
        !ready || (fx && (!quote || preview.pending || preview.expired))
      }
      confirmLabel="Confirm transfer"
      onConfirm={onConfirm}
      onEdit={onEdit}
      onCancel={onClose}
      source={
        <ReviewWallet currency={review.wallet.currency} id={review.wallet.id} />
      }
      target={
        <div className="wallet-review-recipient">
          <div className="wallet-review-identity">
            <Send aria-hidden="true" />
            <bdi>{review.recipient}</bdi>
            <span className="wallet-review-id">
              {review.recipientExisted ? "Saved address" : "New address"}
            </span>
          </div>
          <p>
            Recipient receives <strong>{receives}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Default currency: {review.recipientDefaultCurrency}
            {!review.recipientExisted &&
              " · Saved when the transfer completes."}
          </p>
        </div>
      }
    >
      {fx ? (
        <QuoteDetails
          preview={preview}
          accountId={review.accountId}
          hidden={hidden}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Same currency · No exchange needed.
        </p>
      )}
    </MoneyReview>
  );
}
