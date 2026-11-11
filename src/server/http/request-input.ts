/** Shared bounded UTF-8 JSON reader; Content-Length is not trusted. */
export async function readBoundedJson(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("Missing body.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
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
    reader.releaseLock();
  }
}

export function localJsonRequest(request: Request): boolean {
  try {
    const url = new URL(request.url);
    const expected = request.headers.get("host")
      ? new URL(`${url.protocol}//${request.headers.get("host")}`).origin
      : url.origin;
    return (
      (!request.headers.get("origin") ||
        request.headers.get("origin") === expected) &&
      request.headers.get("sec-fetch-site") !== "cross-site" &&
      request.headers
        .get("content-type")
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase() === "application/json"
    );
  } catch {
    return false;
  }
}
