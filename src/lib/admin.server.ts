import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { unlocked?: boolean };

export function getAdminSessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password) throw new Error("ADMIN_SESSION_SECRET is not set");
  return {
    password,
    name: "admin-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: true,
      // "none" so the session cookie is sent when the app is embedded in
      // the Lovable preview iframe (cross-site context). Requires Secure.
      sameSite: "none" as const,
      path: "/",
    },
  };
}

export function adminPasswordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function getAdminSession() {
  return useSession<AdminSession>(getAdminSessionConfig());
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session.data.unlocked) {
    throw new Error("Unauthorized");
  }
  return session;
}