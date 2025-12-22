import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export type SessionUser = {
  userId: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  tgId?: string;
  firstName?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const token = (await cookies()).get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (typeof payload.userId !== "string") return null;
    if (payload.role !== "USER" && payload.role !== "MODERATOR" && payload.role !== "ADMIN") return null;

    return {
      userId: payload.userId,
      role: payload.role,
      tgId: typeof payload.tgId === "string" ? payload.tgId : undefined,
      firstName: typeof payload.firstName === "string" ? payload.firstName : null,
    };
  } catch {
    return null;
  }
}
