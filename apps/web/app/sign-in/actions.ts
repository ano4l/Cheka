"use server";

import { redirect } from "next/navigation";

import { deriveNameFromEmail, deriveWorkspaceFromEmail, setSession } from "../lib/session";

export async function signInAction(formData: FormData) {
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const nameRaw = String(formData.get("name") ?? "").trim();
  const next = String(formData.get("next") ?? "/dashboard");

  if (!emailRaw || !emailRaw.includes("@")) {
    redirect("/sign-in?error=invalid-email");
  }

  const name = nameRaw || deriveNameFromEmail(emailRaw);
  const workspace = deriveWorkspaceFromEmail(emailRaw);

  await setSession({
    email: emailRaw,
    name,
    workspace,
    signedInAt: new Date().toISOString(),
  });

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function demoSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "demo@cheka.app");
  const name = String(formData.get("name") ?? "Demo user");
  const workspace = String(formData.get("workspace") ?? "Demo workspace");

  await setSession({
    email,
    name,
    workspace,
    signedInAt: new Date().toISOString(),
  });

  redirect("/dashboard");
}
