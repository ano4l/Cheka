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
    accent: "bg-accent text-white",
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
    accent: "bg-white text-ink border border-line",
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
    accent: "bg-white text-ink border border-line",
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

      <div className="flex-1 px-6 py-6">
        {/* KPI strip */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
            <Link className="text-xs text-muted transition hover:text-ink" href="/dashboard/new">
              See all →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                className="group surface flex items-start gap-3 p-4 transition hover:border-slate-300 hover:shadow-soft"
                href={action.href}
                key={action.href}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${action.accent}`}>
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
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <div className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Recent documents</h2>
                <p className="text-xs text-muted">Past 7 days · {demoDocuments.length} reviews</p>
              </div>
              <Link className="text-xs text-muted transition hover:text-ink" href="/dashboard/documents">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {demoDocuments.slice(0, 5).map((doc) => (
                <li key={doc.id}>
                  <DocumentRow doc={doc} />
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <div className="surface overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Risk distribution</h2>
                <p className="text-xs text-muted">Across the past 30 days</p>
              </div>
              <div className="space-y-2.5 px-4 py-3">
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
                        className="h-1.5 w-full overflow-hidden rounded-full"
                        style={{ background: bucket.soft }}
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

            <div className="surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Latest activity</h2>
                <Link className="text-xs text-muted transition hover:text-ink" href="/dashboard/history">
                  Open
                </Link>
              </div>
              <ul className="divide-y divide-line">
                {demoActivity.slice(0, 4).map((event) => (
                  <li className="flex items-start gap-3 px-4 py-3" key={event.id}>
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                        event.kind === "high_risk"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : event.kind === "review_completed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : event.kind === "credit_added"
                              ? "border-accent/30 bg-accent-soft text-accent-strong"
                              : "border-line bg-canvas text-muted"
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
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Tips for higher-quality reviews</h2>
            <span className="text-xs text-muted">3 of 12 · refreshes weekly</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {tips.map((tip, idx) => (
              <div className="surface p-4" key={tip.title}>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-line bg-canvas text-[11px] font-semibold text-muted">
                  {idx + 1}
                </span>
                <h3 className="mt-2.5 text-sm font-semibold text-ink">{tip.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{tip.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
