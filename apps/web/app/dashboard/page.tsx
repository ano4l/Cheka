import Link from "next/link";

import { getSession } from "../lib/session";
import { DashboardTopbar } from "./components/DashboardTopbar";
import { DocumentRow } from "./components/DocumentRow";
import { KpiCard } from "./components/KpiCard";
import { demoActivity, demoDocuments, riskDistribution } from "./components/seed-data";

const quickActions = [
  {
    href: "/dashboard/new",
    title: "Upload a contract",
    body: "Drop a PDF, DOCX, or image to start a new review.",
    accent: "bg-ink text-white",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
      />
    ),
  },
  {
    href: "/dashboard/new?source=text",
    title: "Paste contract text",
    body: "Already have the wording? Skip the upload and analyse text.",
    accent: "bg-butter text-ink",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m-7-9h8a1 1 0 011 1v12a1 1 0 01-1 1H8a1 1 0 01-1-1V8a1 1 0 011-1z"
      />
    ),
  },
  {
    href: "/dashboard/new?source=url",
    title: "Review by URL",
    body: "Send a public link to a contract — we'll fetch & extract.",
    accent: "bg-accent text-white",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14a4 4 0 005.5.5l3-3a4 4 0 00-5.7-5.7l-1.7 1.7M14 10a4 4 0 00-5.5-.5l-3 3a4 4 0 005.7 5.7l1.7-1.7"
      />
    ),
  },
];

const tips = [
  {
    title: "Look for auto-renewal clauses",
    body: "These are the #1 source of subscription lock-in. Cheka flags them automatically.",
  },
  {
    title: "Compare vendor liability",
    body: "Indemnity clauses often shift risk to one side. Ask Cheka who carries the most exposure.",
  },
  {
    title: "Double-check termination fees",
    body: "Exit costs can quietly add 3–6 months of payments — Cheka surfaces every one.",
  },
];

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.name.split(" ")[0] ?? "there";

  const reviewedThisMonth = demoDocuments.filter((d) => d.status === "Reviewed").length;
  const avgScore = Math.round(
    demoDocuments.reduce((sum, d) => sum + d.riskScore, 0) / demoDocuments.length,
  );
  const totalFlags = demoDocuments.reduce((sum, d) => sum + d.flags, 0);
  const highRisk = demoDocuments.filter((d) => d.riskLevel === "high").length;

  return (
    <>
      <DashboardTopbar
        breadcrumbs={[{ label: session?.workspace ?? "Workspace" }, { label: "Overview" }]}
        primaryAction={{ label: "New review", href: "/dashboard/new" }}
        subtitle={`${reviewedThisMonth} reviews this month · ${totalFlags} red flags surfaced`}
        title={`Welcome back, ${firstName}`}
      />

      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        {/* Hero glass strip */}
        <section className="glass-strong relative mb-5 overflow-hidden p-5 sm:mb-6 sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-butter/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {session?.workspace ?? "Workspace"}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Hello {firstName} — let&apos;s read your next contract.
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Upload a document, paste the text, or paste a link. We&apos;ll surface red flags,
                missing clauses, and a clean explanation in under 30 seconds.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link className="btn-primary px-4 py-2 text-sm" href="/dashboard/new">
                Start a review
              </Link>
              <Link className="btn-glass px-4 py-2 text-sm" href="/dashboard/documents">
                Browse documents
              </Link>
            </div>
          </div>
        </section>

        {/* KPI strip */}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <KpiCard
            delta={{ value: "+3 vs last week", trend: "up" }}
            label="Reviews this month"
            value={String(reviewedThisMonth)}
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KpiCard
            delta={{ value: "+6 pts", trend: "up" }}
            hint="risk getting higher"
            label="Avg risk score"
            value={`${avgScore} / 100`}
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1018 0M12 3v9l6 4" />
              </svg>
            }
          />
          <KpiCard
            delta={{ value: `${highRisk} need attention`, trend: "down" }}
            label="Red flags surfaced"
            value={String(totalFlags)}
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V4m0 0h12l-2 4 2 4H4" />
              </svg>
            }
          />
          <KpiCard
            hint="Welcome trial · 5 / month"
            label="Credits remaining"
            value="3"
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0z" />
              </svg>
            }
          />
        </div>

        {/* Quick actions */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
            <Link className="text-xs text-muted transition hover:text-ink" href="/dashboard/new">
              See all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                className="group glass flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-elevated sm:p-5 no-tap-highlight"
                href={action.href}
                key={action.href}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${action.accent} shadow-soft`}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    {action.icon}
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{action.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted">{action.body}</span>
                </span>
                <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* Two-column: recent docs + activity */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.7fr_1fr] lg:gap-5">
          <div className="glass overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/40 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Recent documents</h2>
                <p className="text-xs text-muted">Past 7 days · {demoDocuments.length} reviews</p>
              </div>
              <Link className="text-xs text-muted transition hover:text-ink" href="/dashboard/documents">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-white/40">
              {demoDocuments.slice(0, 5).map((doc) => (
                <li key={doc.id}>
                  <DocumentRow doc={doc} />
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 lg:space-y-5">
            <div className="glass overflow-hidden">
              <div className="border-b border-white/40 px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Risk distribution</h2>
                <p className="text-xs text-muted">Across the past 30 days</p>
              </div>
              <div className="space-y-3 px-4 py-4">
                {riskDistribution.map((bucket) => {
                  const pct = Math.round((bucket.count / bucket.total) * 100);
                  return (
                    <div key={bucket.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">{bucket.label}</span>
                        <span className="text-muted">
                          {bucket.count} · {pct}%
                        </span>
                      </div>
                      <div
                        className="h-2 w-full overflow-hidden rounded-full bg-white/55"
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: bucket.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/40 px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Latest activity</h2>
                <Link className="text-xs text-muted transition hover:text-ink" href="/dashboard/history">
                  Open
                </Link>
              </div>
              <ul className="divide-y divide-white/40">
                {demoActivity.slice(0, 4).map((event) => (
                  <li className="flex items-start gap-3 px-4 py-3" key={event.id}>
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        event.kind === "high_risk"
                          ? "border-rose-200/70 bg-rose-50/80 text-rose-700"
                          : event.kind === "review_completed"
                            ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700"
                            : event.kind === "credit_added"
                              ? "border-butter/40 bg-butter-soft/70 text-butter-deep"
                              : "border-white/70 bg-white/60 text-muted"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        {event.kind === "high_risk" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5 19h14a2 2 0 001.7-3L13.7 4a2 2 0 00-3.4 0L3.3 16A2 2 0 005 19z" />
                        ) : event.kind === "review_completed" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        ) : event.kind === "credit_added" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 0v4m0-4h4m-4 0H8m12 0a8 8 0 11-16 0 8 8 0 0116 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m-8-4h8m-8 8h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
                        )}
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{event.title}</p>
                      <p className="truncate text-xs text-muted">{event.meta}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted">{event.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Tips for higher-quality reviews</h2>
            <span className="hidden text-xs text-muted sm:inline">3 of 12 · refreshes weekly</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tips.map((tip, idx) => (
              <div className="glass p-4 sm:p-5" key={tip.title}>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/65 text-[11px] font-semibold text-ink backdrop-blur">
                  {idx + 1}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink">{tip.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{tip.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
