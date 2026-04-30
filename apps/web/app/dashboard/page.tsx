import Link from "next/link";

import { getSession } from "../lib/session";
import { DashboardTopbar } from "./components/DashboardTopbar";
import { DocumentRow } from "./components/DocumentRow";
import { KpiCard } from "./components/KpiCard";
import { demoActivity, demoDocuments, riskDistribution } from "./components/seed-data";

const quickActions = [
  {
    href: "/dashboard/new",
    title: "Upload contract",
    body: "PDF, DOCX, or image review with extracted evidence.",
    tone: "bg-ink text-white",
    path: "M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2",
  },
  {
    href: "/dashboard/new?source=text",
    title: "Paste text",
    body: "Use raw wording when you do not have a file.",
    tone: "bg-accent text-white",
    path: "M9 12h6m-6 4h6m-7-9h8a1 1 0 011 1v12a1 1 0 01-1 1H8a1 1 0 01-1-1V8a1 1 0 011-1z",
  },
  {
    href: "/dashboard/documents",
    title: "Review high risk",
    body: "Jump to the contracts that need attention first.",
    tone: "bg-rose-600 text-white",
    path: "M12 9v4m0 4h.01M5 19h14a2 2 0 001.7-3L13.7 4a2 2 0 00-3.4 0L3.3 16A2 2 0 005 19z",
  },
];

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.name.split(" ")[0] ?? "there";

  const reviewedThisMonth = demoDocuments.filter((d) => d.status === "Reviewed").length;
  const avgScore = Math.round(demoDocuments.reduce((sum, d) => sum + d.riskScore, 0) / demoDocuments.length);
  const totalFlags = demoDocuments.reduce((sum, d) => sum + d.flags, 0);
  const highRisk = demoDocuments.filter((d) => d.riskLevel === "high").length;

  return (
    <>
      <DashboardTopbar
        breadcrumbs={[{ label: session?.workspace ?? "Workspace" }, { label: "Overview" }]}
        primaryAction={{ label: "New review", href: "/dashboard/new" }}
        subtitle={`${reviewedThisMonth} reviews this month / ${totalFlags} red flags surfaced`}
        title={`Welcome back, ${firstName}`}
      />

      <div className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <KpiCard delta={{ value: "+3 vs last week", trend: "up" }} label="Reviews this month" value={String(reviewedThisMonth)} />
          <KpiCard delta={{ value: "+6 pts", trend: "down" }} hint="risk is trending up" label="Average risk score" value={`${avgScore}/100`} />
          <KpiCard delta={{ value: `${highRisk} urgent`, trend: "down" }} label="Red flags surfaced" value={String(totalFlags)} />
          <KpiCard hint="Welcome trial / 5 per month" label="Credits remaining" value="3" />
        </div>

        <section className="mt-6 grid gap-3 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              className="group glass flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-5"
              href={action.href}
              key={action.href}
            >
              <span className={`icon-tile ${action.tone}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.path} />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{action.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted">{action.body}</span>
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.7fr_1fr] lg:gap-5">
          <div className="glass overflow-hidden">
            <div className="panel-header">
              <div>
                <h2 className="text-sm font-semibold text-ink">Recent documents</h2>
                <p className="text-xs text-muted">Past 7 days / {demoDocuments.length} reviews</p>
              </div>
              <Link className="text-xs font-medium text-accent hover:text-accent-strong" href="/dashboard/documents">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-slate-200/70">
              {demoDocuments.slice(0, 5).map((doc) => (
                <li key={doc.id}>
                  <DocumentRow doc={doc} />
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 lg:space-y-5">
            <div className="glass overflow-hidden">
              <div className="panel-header">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Risk distribution</h2>
                  <p className="text-xs text-muted">Across the past 30 days</p>
                </div>
              </div>
              <div className="space-y-3 px-4 py-4">
                {riskDistribution.map((bucket) => {
                  const pct = Math.round((bucket.count / bucket.total) * 100);
                  return (
                    <div key={bucket.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">{bucket.label}</span>
                        <span className="text-muted">{bucket.count} / {pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bucket.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass overflow-hidden">
              <div className="panel-header">
                <h2 className="text-sm font-semibold text-ink">Latest activity</h2>
                <Link className="text-xs font-medium text-accent hover:text-accent-strong" href="/dashboard/history">
                  Open
                </Link>
              </div>
              <ul className="divide-y divide-slate-200/70">
                {demoActivity.slice(0, 4).map((event) => (
                  <li className="flex items-start gap-3 px-4 py-3" key={event.id}>
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
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
      </div>
    </>
  );
}
