import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function GET() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
  }

  const session = (await cookies()).get("session")?.value;
  if (!session) {
    return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(session, new TextEncoder().encode(secret));
    return NextResponse.json({ ok: true, user: payload });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad session" }, { status: 401 });
  }
}
