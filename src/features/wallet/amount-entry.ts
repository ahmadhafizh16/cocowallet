import { MAX_AMOUNT_INPUT_LENGTH } from "../money/money";

/** Group text, never a Number: preserve every fractional digit and trailing dot. */
export function groupedAmount(raw: string): string {
  const [whole = "", fraction] = raw.split(".");
  return (
    whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",") +
    (fraction === undefined ? "" : `.${fraction}`)
  );
}

export function amountEdit(text: string): string | null {
  const raw = text.replaceAll(",", "");
  if (raw.length > MAX_AMOUNT_INPUT_LENGTH || !/^\d*(?:\.\d*)?$/u.test(raw))
    return null;
  if (raw === "") return "";
  const [whole = "", fraction] = raw.split(".");
  const integer =
    whole.replace(/^0+(?=\d)/u, "") || (fraction === undefined ? "" : "0");
  return integer + (fraction === undefined ? "" : `.${fraction}`);
}
