import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "../../../lib/session";
import { DashboardTopbar } from "../../components/DashboardTopbar";
import { demoDocuments } from "../../components/seed-data";

const sampleEvidence: Record<string, Array<{ heading: string; quote: string; impact: string }>> = {
  default: [
    {
      heading: "Auto-renewal clause",
      quote:
        "This agreement shall automatically renew for successive 12-month terms unless written notice of non-renewal is delivered no less than ninety (90) days prior to the end of the then-current term.",
      impact: "+18 risk · Cancel notice window is unusually long",
    },
    {
      heading: "Termination penalty",
      quote:
        "If Tenant terminates this Lease prior to the expiry date, Tenant shall pay an early-termination charge equal to three (3) months' Rent.",
      impact: "+16 risk · Significant exit cost",
    },
    {
      heading: "Liability and indemnity",
      quote:
        "Tenant shall indemnify, defend, and hold harmless Landlord from and against any and all claims, damages, losses, and expenses arising out of Tenant's use of the Premises.",
      impact: "+17 risk · Indemnity is one-sided",
    },
  ],
};

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  const doc = demoDocuments.find((d) => d.id === id);
  if (!doc) notFound();

  const evidence = sampleEvidence.default;

  const riskColor =
    doc.riskLevel === "low"
      ? { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", ring: "#16a34a" }
      : doc.riskLevel === "medium"
        ? { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", ring: "#d97706" }
        : { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", ring: "#dc2626" };

  return (
    <>
      <DashboardTopbar
        breadcrumbs={[
          { label: session?.workspace ?? "Workspace", href: "/dashboard" },
          { label: "Documents", href: "/dashboard/documents" },
          { label: doc.name },
        ]}
        primaryAction={{ label: "Open in workspace", href: "/dashboard/new" }}
        subtitle={`${doc.type} · ${doc.market} · reviewed ${doc.reviewedAt}`}
        title={doc.name}
      />

      <div className="flex-1 px-6 py-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="surface p-5">
              <div className="flex items-start gap-5">
                <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 ${riskColor.border} ${riskColor.bg}`}>
                  <span className={`text-2xl font-bold tabular-nums ${riskColor.text}`}>{doc.riskScore}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`badge ${riskColor.border} ${riskColor.bg} ${riskColor.text}`}>
                    {doc.riskLevel.toUpperCase()} RISK
                  </span>
                  <h2 className="mt-2 text-base font-semibold text-ink">Summary</h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {doc.riskLevel === "high"
                      ? "Several clauses materially shift risk to the signer. Key concerns include a long auto-renewal window, an early-termination penalty equivalent to multiple months of payment, and one-sided indemnity. We recommend a lawyer review before signing."
                      : doc.riskLevel === "medium"
                        ? "The contract is workable but contains a few clauses that should be negotiated. The auto-renewal window is longer than market standard, and the cancellation fee is on the higher end."
                        : "This contract is broadly fair. Terms are clearly stated, exit conditions are reasonable, and liability is appropriately balanced."}
                  </p>
                </div>
              </div>
            </div>

            <div className="surface overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Red flags · {evidence.length}</h2>
                <p className="text-xs text-muted">Clauses with verbatim evidence and weighted risk scoring</p>
              </div>
              <ul className="divide-y divide-line">
                {evidence.map((item) => (
                  <li className="px-4 py-4" key={item.heading}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5 19h14a2 2 0 001.7-3L13.7 4a2 2 0 00-3.4 0L3.3 16A2 2 0 005 19z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{item.heading}</p>
                        <blockquote className="mt-1.5 rounded-md border-l-2 border-rose-300 bg-rose-50/50 px-3 py-2 text-xs italic leading-5 text-ink">
                          “{item.quote}”
                        </blockquote>
                        <p className="mt-1.5 text-xs font-medium text-rose-700">{item.impact}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface p-4">
              <h2 className="text-sm font-semibold text-ink">Recommended actions</h2>
              <ul className="mt-2.5 space-y-2 text-sm text-muted">
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Negotiate the auto-renewal notice window down to 30 days.
                </li>
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Cap early-termination at 1 month rather than 3.
                </li>
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Mutual indemnity — both parties carry their own negligence.
                </li>
              </ul>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="surface p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Details</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Document</dt>
                  <dd className="text-right text-ink">{doc.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Type</dt>
                  <dd className="text-ink">{doc.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Market</dt>
                  <dd className="text-ink">{doc.market}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Uploaded by</dt>
                  <dd className="text-ink">{doc.uploader}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Reviewed</dt>
                  <dd className="text-ink">{doc.reviewedAt}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Status</dt>
                  <dd className="text-ink">{doc.status}</dd>
                </div>
              </dl>
            </div>

            <div className="surface p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Follow-ups remaining</h3>
              <p className="mt-2 text-xl font-semibold text-ink">2 of 3</p>
              <p className="mt-1 text-xs text-muted">Ask anything about cancellation, fees, or whether the contract is safe to sign.</p>
              <Link className="btn-accent mt-3 w-full px-3 py-2 text-xs" href="/dashboard/new">
                Ask a follow-up
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
