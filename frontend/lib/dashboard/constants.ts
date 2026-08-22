// Kept separate from payload.ts (which imports next/headers) so proxy.ts
// (Edge middleware — no next/headers there) can use these without pulling
// server-only code into the Edge bundle.
export const CMS_URL = process.env.CMS_URL || "http://localhost:3001";
export const SESSION_COOKIE = "dashboard_token";
