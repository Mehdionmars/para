import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const draft = await draftMode();
  draft.disable();

  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/";
  // Same fix as ../route.ts: request.url's origin reflects the container's
  // HOSTNAME=0.0.0.0 bind address, not the Host header the browser sent.
  const host = request.headers.get("host") || requestUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");
  return NextResponse.redirect(new URL(next, `${protocol}://${host}`));
}
