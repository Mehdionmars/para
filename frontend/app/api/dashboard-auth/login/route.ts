import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CMS_URL, SESSION_COOKIE } from "@/lib/dashboard/payload";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const res = await fetch(`${CMS_URL}/api/users/login`, {
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
  }

  const data = await res.json();
  const store = await cookies();
  store.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    maxAge: 60 * 60 * 2, // matches Payload's default 2h token lifetime
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ user: { email: data.user.email, id: data.user.id } });
}
