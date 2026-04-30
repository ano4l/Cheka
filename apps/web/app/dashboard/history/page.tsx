import { getSession } from "../../lib/session";
import { DashboardTopbar } from "../components/DashboardTopbar";
import { demoActivity } from "../components/seed-data";

export default async function HistoryPage() {
  const session = await getSession();

  return (
    <>
      <DashboardTopbar
        breadcrumbs={[
          { label: session?.workspace ?? "Workspace", href: "/dashboard" },
          { label: "Activity" },
        ]}
        subtitle="A timeline of every review, follow-up, and credit event in this workspace"
        title="Activity"
      />

      <div className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6">
        <div className="glass overflow-hidden">
          <ul className="divide-y divide-white/40">
            {demoActivity.map((event) => (
              <li className="flex items-start gap-3 px-4 py-3 sm:px-5" key={event.id}>
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
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
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    )}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{event.title}</p>
                  <p className="text-xs text-muted">{event.meta}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted">{event.when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
