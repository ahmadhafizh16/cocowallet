import "server-only";
import {
  parseCatalog,
  parseRateCsv,
  timestamp,
  fiatExponent,
} from "./validation";
import type { FiatCurrency } from "./contracts";

export type FrankfurterClient = {
  catalog(): Promise<{ currencies: FiatCurrency[]; fetchedAt: string }>;
  rate(
    base: string,
    quote: string,
  ): Promise<{ rate: string; date: string; fetchedAt: string }>;
};

/** Fixed provider origin; dependency injection is for deterministic tests only. */
export function createFrankfurterClient({
  fetcher = fetch,
  now = Date.now,
  timeoutMs = 5000,
}: {
  fetcher?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
} = {}): FrankfurterClient {
  async function request(path: string, accept: string, limit: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetcher(`https://api.frankfurter.dev/v2/${path}`, {
        headers: { Accept: accept },
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok || !response.body)
        throw new Error("Upstream unavailable.");
      const mediaType = response.headers
        .get("content-type")
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase();
      if (mediaType !== accept)
        throw new Error("Unexpected upstream media type.");
      reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
          await reader.cancel();
          throw new Error("Oversized upstream response.");
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      return {
        text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        fetchedAt: timestamp(now()),
      };
    } finally {
      clearTimeout(timeout);
      reader?.releaseLock();
    }
  }
  return {
    async catalog() {
      const response = await request(
        "currencies",
        "application/json",
        1024 * 1024,
      );
      return {
        currencies: parseCatalog(JSON.parse(response.text)),
        fetchedAt: response.fetchedAt,
      };
    },
    async rate(base, quote) {
      fiatExponent(base);
      fiatExponent(quote);
      if (base === quote) throw new Error("Distinct currency pair required.");
      const response = await request(
        `rates.csv?base=${encodeURIComponent(base)}&quotes=${encodeURIComponent(quote)}`,
        "text/csv",
        8192,
      );
      return {
        ...parseRateCsv(response.text, base, quote, response.fetchedAt),
        fetchedAt: response.fetchedAt,
      };
    },
  };
}
