/** Shared bounded UTF-8 JSON reader; Content-Length is not trusted. */
export const MAX_JSON_BYTES = 16_384;
export async function readBoundedJson(request: Request): Promise<unknown> {
  request.signal.throwIfAborted();
  if (!request.body) throw new Error("Missing body.");
  const reader = request.body.getReader();
  const abort = () => {
    void reader.cancel().catch(() => {
      /* Best-effort cancellation; preserve the abort error. */
    });
  };
  request.signal.addEventListener("abort", abort, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  let finished = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      request.signal.throwIfAborted();
      if (done) {
        finished = true;
        break;
      }
      size += value.byteLength;
      if (size > MAX_JSON_BYTES) {
        throw new Error("Oversized body.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally {
    request.signal.removeEventListener("abort", abort);
    if (!finished) {
      try {
        await reader.cancel();
      } catch {
        /* Preserve the original read failure. */
      }
    }
    reader.releaseLock();
  }
}

/** Host is the direct authority: forwarded headers do not configure a proxy or
 * widen browser write permission. CLI callers may omit Origin, not validation. */
export function jsonWriteIssue(
  request: Request,
): "authority" | "origin" | "content-type" | undefined {
  let expected: string;
  try {
    const url = new URL(request.url);
    if (!["http:", "https:"].includes(url.protocol)) return "authority";
    const host = request.headers.get("host");
    if (host !== null && (!host || /[\s/\\?#@]/u.test(host)))
      return "authority";
    expected = host ? new URL(`${url.protocol}//${host}`).origin : url.origin;
  } catch {
    return "authority";
  }
  if (
    (request.headers.get("origin") &&
      request.headers.get("origin") !== expected) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return "origin";
  if (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() !== "application/json"
  )
    return "content-type";
}
export function localJsonRequest(request: Request): boolean {
  return jsonWriteIssue(request) === undefined;
}

export async function readValidatedJson<T>(
  request: Request,
  validate: (value: unknown) => value is T,
): Promise<T> {
  const value = await readBoundedJson(request);
  if (!validate(value)) throw new Error("Invalid request shape.");
  return value;
}
