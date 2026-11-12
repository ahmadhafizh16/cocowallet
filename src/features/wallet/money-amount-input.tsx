"use client";
import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { amountEdit, groupedAmount } from "./amount-entry";

export function MoneyAmountInput({
  value,
  onValueChange,
  symbol,
  hidden,
  ...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
  symbol: string;
  hidden: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const [invalidEdit, setInvalidEdit] = useState(false);
  useLayoutEffect(() => {
    const logicalCaret = pendingCaret.current;
    pendingCaret.current = null;
    const element = input.current;
    if (logicalCaret === null || !element || document.activeElement !== element)
      return;
    let position = 0,
      seen = 0;
    while (position < element.value.length && seen < logicalCaret) {
      if (element.value[position] !== ",") seen++;
      position++;
    }
    element.setSelectionRange(position, position);
  });
  return (
    <div className="wallet-amount-entry">
      <span className="wallet-amount-symbol" aria-hidden="true">
        {symbol}
      </span>
      <Input
        {...props}
        ref={input}
        type="text"
        name="amount"
        className="wallet-amount-input"
        inputMode="decimal"
        autoComplete="off"
        readOnly={hidden}
        value={hidden ? "" : groupedAmount(value)}
        placeholder={hidden ? "Hidden" : "0.00"}
        onPaste={(event) => {
          const text = event.clipboardData.getData("text");
          if (
            !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/u.test(text) &&
            !/^\.\d+$/u.test(text)
          ) {
            event.preventDefault();
            setInvalidEdit(true);
          }
        }}
        onChange={(event) => {
          const raw = amountEdit(event.target.value);
          if (raw === null) {
            setInvalidEdit(true);
            return;
          }
          setInvalidEdit(false);
          const logicalCaret =
            Math.max(
              0,
              raw.length - event.target.value.replaceAll(",", "").length,
            ) +
            event.target.value
              .slice(
                0,
                event.target.selectionStart ?? event.target.value.length,
              )
              .replaceAll(",", "").length;
          pendingCaret.current = logicalCaret;
          onValueChange(raw);
        }}
      />
      {invalidEdit && (
        <p className="wallet-amount-edit-hint" role="status">
          Use numbers and one decimal point only.
        </p>
      )}
    </div>
  );
}
