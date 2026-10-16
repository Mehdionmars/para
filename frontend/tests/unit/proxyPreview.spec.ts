import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

/**
 * Links clicked inside the Storefront Builder's preview.
 *
 * The preview is the shop served under /preview on the admin host. Its links
 * point at the shop's own paths, and on that host /produit/… used to be
 * rewritten into /dashboard/produit/… — the dashboard's "fiche introuvable"
 * inside the builder.
 */

function request(path: string, headers: Record<string, string> = {}) {
  // The origin the standalone server reports, not the one the browser used.
  return new NextRequest(`http://0.0.0.0:3000${path}`, {
    headers: { host: "admin.paradhiver.ma", "x-forwarded-proto": "https", ...headers },
  });
}

describe("proxy: storefront preview on the admin host", () => {
  it("keeps a link clicked in the preview inside the preview", () => {
    const res = proxy(request("/produit/soin-lissant?x=1", { referer: "https://admin.paradhiver.ma/preview" }));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://admin.paradhiver.ma/preview/produit/soin-lissant?x=1");
  });

  it("follows on from a page already deep in the preview", () => {
    const res = proxy(request("/catalogue", { referer: "https://admin.paradhiver.ma/preview/produit/soin-lissant" }));

    expect(res.headers.get("location")).toBe("https://admin.paradhiver.ma/preview/catalogue");
  });

  it("serves the shop under the prefix", () => {
    const res = proxy(request("/preview/produit/soin-lissant"));

    expect(res.headers.get("x-middleware-rewrite")).toContain("/produit/soin-lissant");
  });

  it("still sends the dashboard's own paths to the dashboard", () => {
    const res = proxy(request("/products", { referer: "https://admin.paradhiver.ma/orders" }));

    expect(res.headers.get("x-middleware-rewrite")).toContain("/dashboard/products");
  });

  it("does not treat a /dashboard path requested from the preview as a shop page", () => {
    const res = proxy(
      request("/dashboard/products", { referer: "https://admin.paradhiver.ma/preview", cookie: "dashboard_token=x" }),
    );

    expect(res.headers.get("location")).toBeNull();
  });
});
