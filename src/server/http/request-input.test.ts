import {
  jsonWriteIssue,
  localJsonRequest,
  MAX_JSON_BYTES,
  readBoundedJson,
  readValidatedJson,
} from "./request-input";
import { fundingRequestContract } from "@/features/funding/contracts";

const request = (headers: Record<string, string> = {}) =>
  new Request("http://0.0.0.0:3000/api/deposits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "wallet.test:3000",
      ...headers,
    },
  });
function streamed(
  chunks: Uint8Array[],
  cancel = jest.fn(),
  signal?: AbortSignal,
) {
  return new Request("http://localhost/api/deposits", {
    method: "POST",
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
      cancel,
    }),
    duplex: "half",
    signal,
  } as RequestInit);
}
describe("shared write-request policy", () => {
  it.each<Record<string, string>>([
    {},
    { Origin: "http://wallet.test:3000" },
    { "Content-Type": "Application/JSON; charset=utf-8" },
    { Host: "[::1]:3000", Origin: "http://[::1]:3000" },
    {
      Origin: "http://wallet.test:3000",
      "X-Forwarded-Host": "evil.test",
      "X-Forwarded-Proto": "https",
    },
  ])("accepts direct same-origin JSON or CLI requests: %j", (headers) => {
    expect(jsonWriteIssue(request(headers))).toBeUndefined();
    expect(localJsonRequest(request(headers))).toBe(true);
  });
  it.each<Record<string, string>>([
    { Origin: "https://wallet.test:3000" },
    { Origin: "http://wallet.test:3001" },
    { Origin: "null" },
    { Origin: "http://evil.test", "X-Forwarded-Host": "evil.test" },
    { "Sec-Fetch-Site": "cross-site" },
  ])("rejects explicit foreign browser context: %j", (headers) => {
    expect(jsonWriteIssue(request(headers))).toBe("origin");
    expect(localJsonRequest(request(headers))).toBe(false);
  });
  it.each([
    "wallet.test/path",
    "wallet.test?query",
    "wallet.test#fragment",
    "user@wallet.test",
    "wallet.test\\path",
    "wallet.test:invalid",
    "",
    "http://wallet.test",
  ])("rejects malformed direct Host authority %j", (host) =>
    expect(jsonWriteIssue(request({ Host: host }))).toBe("authority"),
  );
  it.each(["text/plain", "application/problem+json", "application/jsonx", ""])(
    "rejects non-JSON content type %j",
    (type) =>
      expect(jsonWriteIssue(request({ "Content-Type": type }))).toBe(
        "content-type",
      ),
  );
  it("does not require a Host header when the URL already has the direct authority", () => {
    const value = new Request("http://localhost:3000/api/quotes", {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
    });
    expect(localJsonRequest(value)).toBe(true);
  });
});
describe("bounded UTF-8 JSON input", () => {
  const encode = (value: string) => new TextEncoder().encode(value);
  it("counts bytes, accepts exactly 16 KiB, and ignores misleading Content-Length", async () => {
    const body = `"${"a".repeat(MAX_JSON_BYTES - 2)}"`,
      value = new Request("http://localhost/api/quotes", {
        method: "POST",
        headers: { "Content-Length": "1" },
        body,
      });
    expect(await readBoundedJson(value)).toBe("a".repeat(MAX_JSON_BYTES - 2));
    expect(value.body!.locked).toBe(false);
  });
  it("decodes split multi-byte UTF-8 only after bounded assembly", async () => {
    const bytes = encode('"وجهة-💰"'),
      value = streamed([bytes.slice(0, 2), bytes.slice(2, 9), bytes.slice(9)]);
    expect(await readBoundedJson(value)).toBe("وجهة-💰");
    expect(value.body!.locked).toBe(false);
  });
  it("rejects a multi-byte body beyond the byte limit even if its character count is smaller", async () => {
    const value = streamed([encode(`"${"💰".repeat(4096)}"`)]);
    await expect(readBoundedJson(value)).rejects.toThrow();
    expect(value.body!.locked).toBe(false);
  });
  it("cancels an oversized open stream and releases its lock", async () => {
    const cancel = jest.fn();
    const value = new Request("http://localhost/api/quotes", {
      method: "POST",
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(MAX_JSON_BYTES));
          controller.enqueue(new Uint8Array(1));
        },
        cancel,
      }),
      duplex: "half",
    } as RequestInit);
    await expect(readBoundedJson(value)).rejects.toThrow("Oversized");
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(value.body!.locked).toBe(false);
  });
  it.each(["{", "", '"unterminated'])(
    "releases the reader on invalid JSON %j",
    async (body) => {
      const value = streamed([encode(body)]);
      await expect(readBoundedJson(value)).rejects.toThrow();
      expect(value.body!.locked).toBe(false);
    },
  );
  it("rejects malformed UTF-8 instead of replacing it", async () => {
    const value = streamed([new Uint8Array([0x22, 0xc3, 0x28, 0x22])]);
    await expect(readBoundedJson(value)).rejects.toThrow();
    expect(value.body!.locked).toBe(false);
  });
  it("rejects absent, already-consumed and aborted bodies", async () => {
    await expect(readBoundedJson(request())).rejects.toThrow();
    const consumed = streamed([encode("{}")]);
    await consumed.text();
    await expect(readBoundedJson(consumed)).rejects.toThrow();
    const controller = new AbortController();
    controller.abort();
    const aborted = streamed([encode("{}")], jest.fn(), controller.signal);
    await expect(readBoundedJson(aborted)).rejects.toThrow();
    expect(aborted.body!.locked).toBe(false);
  });
  it("preserves stream failure and releases its lock", async () => {
    const value = new Request("http://localhost/api/quotes", {
      method: "POST",
      body: new ReadableStream({
        start(controller) {
          controller.error(new Error("private stream failure"));
        },
      }),
      duplex: "half",
    } as RequestInit);
    await expect(readBoundedJson(value)).rejects.toThrow(
      "private stream failure",
    );
    expect(value.body!.locked).toBe(false);
  });
  it("interrupts a pending stream read on abort and releases its reader", async () => {
    const controller = new AbortController(),
      cancel = jest.fn();
    const value = new Request("http://localhost/api/quotes", {
      method: "POST",
      body: new ReadableStream({ cancel }),
      duplex: "half",
      signal: controller.signal,
    } as RequestInit);
    const pending = readBoundedJson(value);
    controller.abort();
    await expect(pending).rejects.toThrow();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(value.body!.locked).toBe(false);
  });
  it("validates structural input without normalizing exact strings", async () => {
    const body = {
      walletId: " wallet ",
      amount: "1.00",
      provider: "demo_bank",
    };
    expect(
      await readValidatedJson(
        streamed([encode(JSON.stringify(body))]),
        fundingRequestContract.is,
      ),
    ).toEqual(body);
    await expect(
      readValidatedJson(
        streamed([encode(JSON.stringify({ ...body, amount: 1 }))]),
        fundingRequestContract.is,
      ),
    ).rejects.toThrow();
  });
});
