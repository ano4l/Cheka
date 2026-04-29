import { cookies } from "next/headers";

export interface DemoSession {
  email: string;
  name: string;
  workspace: string;
  signedInAt: string;
}

const COOKIE_NAME = "cheka_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getSession(): Promise<DemoSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as DemoSession;
    if (!decoded.email) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function setSession(session: DemoSession): Promise<void> {
  const store = await cookies();
  const value = Buffer.from(JSON.stringify(session), "utf-8").toString("base64url");
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Cheka user";
}

export function deriveWorkspaceFromEmail(email: string): string {
  const domain = email.split("@")[1]?.split(".")[0];
  if (!domain || domain === "gmail" || domain === "outlook" || domain === "yahoo" || domain === "hotmail") {
    return "Personal workspace";
  }
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";
}
