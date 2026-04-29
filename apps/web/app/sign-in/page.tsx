import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckaLogo } from "../components/CheckaLogo";
import { getSession } from "../lib/session";
import { demoSignInAction, signInAction } from "./actions";

export const metadata: Metadata = {
  title: "Sign in · Cheka",
  description: "Sign in to your Cheka workspace to review contracts and track past reviews.",
};

const demoAccounts = [
  {
    name: "Amara Okeke",
    email: "amara@brightpath.co.za",
    workspace: "BrightPath Legal",
    role: "SME owner · Cape Town",
    initials: "AO",
  },
  {
    name: "James Mwangi",
    email: "james@hodari.ke",
    workspace: "Hodari Realty",
    role: "Property manager · Nairobi",
    initials: "JM",
  },
  {
    name: "Demo user",
    email: "demo@cheka.app",
    workspace: "Demo workspace",
    role: "Try the dashboard",
    initials: "DM",
  },
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const existing = await getSession();
  const params = await searchParams;
  if (existing) {
    redirect(params.next ?? "/dashboard");
  }

  const errorMessage =
    params.error === "invalid-email"
      ? "Please enter a valid email address."
      : null;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-canvas">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
        <section className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <CheckaLogo className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight text-ink">Cheka</span>
            <span className="rounded-md border border-line bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
              Demo
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Sign in to your contract review workspace.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            This is a demo workspace. Sign in with any email — we&apos;ll create a temporary session so
            you can upload contracts, see scored reviews, and try the follow-up assistant.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            {[
              "Drag-and-drop contracts (PDF, DOCX, image)",
              "Risk scoring with verbatim evidence",
              "3 free follow-up questions per review",
              "All sessions are local to this browser",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="surface p-6 shadow-soft sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Continue to dashboard</h2>
            <span className="badge border-accent/30 bg-accent-soft text-accent-strong">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Demo mode
            </span>
          </div>

          <form action={signInAction} className="space-y-3">
            <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
            <div className="space-y-1.5">
              <label className="label" htmlFor="email">
                Work email
              </label>
              <input
                autoComplete="email"
                className="input"
                id="email"
                name="email"
                placeholder="you@company.com"
                required
                type="email"
              />
            </div>
            <div className="space-y-1.5">
              <label className="label" htmlFor="name">
                Display name <span className="text-muted">· optional</span>
              </label>
              <input
                autoComplete="name"
                className="input"
                id="name"
                name="name"
                placeholder="Optional"
                type="text"
              />
            </div>
            {errorMessage ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {errorMessage}
              </p>
            ) : null}
            <button className="btn-primary w-full" type="submit">
              Sign in to dashboard
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-5-5m5 5l-5 5" />
              </svg>
            </button>
            <p className="text-center text-[11px] text-muted">
              No password required in demo mode. Sessions last 7 days in this browser.
            </p>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-line" />
            or pick a demo account
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <form action={demoSignInAction} key={account.email}>
                <input type="hidden" name="email" value={account.email} />
                <input type="hidden" name="name" value={account.name} />
                <input type="hidden" name="workspace" value={account.workspace} />
                <button
                  className="flex w-full items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-canvas"
                  type="submit"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
                    {account.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{account.name}</span>
                    <span className="block truncate text-xs text-muted">{account.role}</span>
                  </span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            New to Cheka?{" "}
            <Link className="font-medium text-accent hover:text-accent-strong" href="/">
              See how it works
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
