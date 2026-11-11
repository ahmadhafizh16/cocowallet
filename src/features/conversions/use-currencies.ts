"use client";
import { useEffect, useState } from "react";
import { fiatExponent } from "../rates/validation";

export function useConversionCurrencies(enabled: boolean) {
  const [state, setState] = useState<{ codes?: string[]; message?: string }>(
    {},
  );
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    void (async () => {
      try {
        const response = await fetch("/api/currencies", {
          cache: "no-store",
          signal: controller.signal,
        });
        const value = await response.json();
        if (
          !response.ok ||
          !value ||
          !Array.isArray(value.currencies) ||
          !value.currencies.length ||
          value.currencies.length > 1000
        )
          throw new Error("Invalid catalog");
        const codes = value.currencies.map(
          (currency: { code: string; exponent: number }) => {
            if (fiatExponent(currency.code) !== currency.exponent)
              throw new Error("Invalid precision");
            return currency.code;
          },
        );
        if (new Set(codes).size !== codes.length)
          throw new Error("Duplicate currency");
        if (active) setState({ codes });
      } catch {
        if (active)
          setState({
            message:
              "Currency list unavailable. Existing wallet currencies remain selectable; the quote service must still validate their eligibility.",
          });
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [enabled]);
  return state;
}
