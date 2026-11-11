import { createFundingKey } from "./request-key";
import { normalizeRequestKey } from "./contracts";

describe("secure funding keys", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  afterEach(() => {
    if (descriptor) Object.defineProperty(globalThis, "crypto", descriptor);
    else Reflect.deleteProperty(globalThis, "crypto");
  });
  it("uses native randomUUID when available", () => {
    const key = "12345678-1234-4123-8123-123456789012";
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { randomUUID: () => key },
    });
    expect(createFundingKey()).toBe(key);
  });
  it("uses cryptographically random bytes and correct UUID version/variant on local HTTP", () => {
    const random = jest.fn((bytes: Uint8Array) => {
      bytes.fill(255);
      return bytes;
    });
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { getRandomValues: random },
    });
    const key = createFundingKey();
    expect(key).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    expect(normalizeRequestKey(key)).toBe(key);
    expect(random).toHaveBeenCalledTimes(1);
  });
  it("fails closed without secure randomness", () => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {},
    });
    expect(() => createFundingKey()).toThrow("Secure randomness unavailable");
  });
});
