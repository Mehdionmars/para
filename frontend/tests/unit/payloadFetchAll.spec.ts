import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "token" }) }) }));

import { payloadCount, payloadFetchAll } from "@/lib/dashboard/payload";

/** A fake Payload list endpoint: `total` documents, numbered 1..total. */
function serve(total: number, { failPage }: { failPage?: number } = {}) {
  const seen: number[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const u = new URL(url);
      const limit = Number(u.searchParams.get("limit"));
      const page = Number(u.searchParams.get("page"));
      seen.push(page);
      if (page === failPage) return new Response("boom", { status: 500 });
      const start = (page - 1) * limit;
      const docs = Array.from({ length: Math.max(0, Math.min(limit, total - start)) }, (_, i) => ({ id: start + i + 1 }));
      return Response.json({ docs, totalPages: Math.max(1, Math.ceil(total / limit)) });
    }),
  );
  return seen;
}

afterEach(() => vi.unstubAllGlobals());

describe("payloadFetchAll", () => {
  it("returns every document, in order, across parallel pages", async () => {
    const seen = serve(2345);
    const docs = await payloadFetchAll<{ id: number }>("/api/products?depth=0", 100);
    expect(docs).toHaveLength(2345);
    expect(docs!.map((d) => d.id)).toEqual(Array.from({ length: 2345 }, (_, i) => i + 1));
    // The first page alone, then the rest.
    expect(seen[0]).toBe(1);
    expect(new Set(seen).size).toBe(24);
  });

  it("fails the whole list when one page fails, rather than returning a slice", async () => {
    serve(1000, { failPage: 3 });
    expect(await payloadFetchAll("/api/orders", 100)).toBeNull();
  });

  it("makes one request when everything fits on the first page", async () => {
    const seen = serve(40);
    expect(await payloadFetchAll("/api/orders")).toHaveLength(40);
    expect(seen).toEqual([1]);
  });
});

describe("payloadCount", () => {
  it("reads totalDocs, and says null rather than 0 when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ totalDocs: 18013 })));
    expect(await payloadCount("/api/notifications/count")).toBe(18013);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 403 })));
    expect(await payloadCount("/api/notifications/count")).toBeNull();
  });
});
