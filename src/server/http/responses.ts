import type { ProblemDetails, ProblemStatus } from "@/lib/problem-details";

type Options = { status?: 200 | ProblemStatus; replayed?: boolean };
/** Native SQLite/Jest can return data from another realm. Compare genuine native
 * constructors/prototypes without invoking data getters or custom serializers. */
function nativePrototype(
  prototype: object | null,
  expected: ObjectConstructor | ArrayConstructor,
): boolean {
  if (!prototype || Object.hasOwn(prototype, "toJSON")) return false;
  const constructor = Object.getOwnPropertyDescriptor(
    prototype,
    "constructor",
  )?.value;
  return (
    typeof constructor === "function" &&
    Object.getOwnPropertyDescriptor(constructor, "prototype")?.value ===
      prototype &&
    Function.prototype.toString.call(constructor) ===
      Function.prototype.toString.call(expected)
  );
}
function objectPrototype(prototype: object | null): boolean {
  return (
    prototype !== null &&
    Object.getPrototypeOf(prototype) === null &&
    nativePrototype(prototype, Object)
  );
}
/** Only plain JSON data crosses this boundary. Do not run custom toJSON/getters
 * or silently drop fields, sparse array entries, cycles or inexact numbers. */
function assertJson(value: unknown, ancestors = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number") {
    if (
      Number.isFinite(value) &&
      !Object.is(value, -0) &&
      (!Number.isInteger(value) || Number.isSafeInteger(value))
    )
      return;
  } else if (typeof value === "object") {
    const array = Array.isArray(value),
      prototype = Object.getPrototypeOf(value);
    if (
      ancestors.has(value) ||
      (array
        ? !nativePrototype(prototype, Array) ||
          !objectPrototype(Object.getPrototypeOf(prototype))
        : prototype !== null && !objectPrototype(prototype))
    )
      throw new Error("Response is not plain JSON data.");
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (array && Object.keys(value).length !== value.length)
      throw new Error("Response contains a sparse or extended array.");
    ancestors.add(value);
    try {
      for (const key of Reflect.ownKeys(descriptors)) {
        if (array && key === "length") continue;
        if (typeof key !== "string")
          throw new Error("Response contains a non-JSON key.");
        const descriptor = descriptors[key]!;
        if (
          !descriptor.enumerable ||
          !Object.hasOwn(descriptor, "value") ||
          (array &&
            (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= value.length))
        )
          throw new Error("Response contains a non-JSON property.");
        assertJson(descriptor.value, ancestors);
      }
    } finally {
      ancestors.delete(value);
    }
    return;
  }
  throw new Error("Response is not lossless JSON.");
}
function response(
  body: unknown,
  type: "application/json" | "application/problem+json",
  { status = 200, replayed }: Options = {},
) {
  // Features format monetary bigint explicitly; the boundary never coerces it.
  assertJson(body);
  const text = JSON.stringify(body);
  return new Response(text, {
    status,
    headers: {
      "Content-Type": type,
      "Cache-Control": "no-store",
      ...(replayed === undefined
        ? {}
        : { "Idempotency-Replayed": String(replayed) }),
    },
  });
}
export function jsonResponse(body: unknown) {
  return response(body, "application/json");
}
export function problemResponse(body: ProblemDetails) {
  return response(body, "application/problem+json", { status: body.status });
}
/** Preserve the original retained body and status. Serialization failures must
 * escape to the feature's unknown-outcome catch, never become a definitive error. */
export function monetaryResponse(result: {
  status: 200 | ProblemStatus;
  body: unknown;
  replayed: boolean;
}) {
  return response(
    result.body,
    result.status === 200 ? "application/json" : "application/problem+json",
    result,
  );
}
