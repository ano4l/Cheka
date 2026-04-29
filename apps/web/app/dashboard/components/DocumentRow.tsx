import Link from "next/link";

import type { DemoDocument } from "./seed-data";

const riskBadge: Record<DemoDocument["riskLevel"], string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-rose-200 bg-rose-50 text-rose-800",
};

const statusBadge: Record<DemoDocument["status"], string> = {
  Reviewed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Awaiting payment": "border-amber-200 bg-amber-50 text-amber-800",
  Processing: "border-sky-200 bg-sky-50 text-sky-800",
};

const typeIcon: Record<DemoDocument["type"], string> = {
  Lease: "🏠",
  Employment: "💼",
  Service: "🛠️",
  NDA: "🔒",
  Loan: "💸",
  SaaS: "☁️",
};

interface Props {
  doc: DemoDocument;
}

export function DocumentRow({ doc }: Props) {
  return (
    <Link
      className="group flex items-center gap-4 px-4 py-3 transition hover:bg-canvas"
      href={`/dashboard/documents/${doc.id}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-base">
        {typeIcon[doc.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
        <p className="truncate text-xs text-muted">
          {doc.type} · {doc.market} · {doc.shortReviewedAt}
        </p>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <span className={`badge ${riskBadge[doc.riskLevel]}`}>
          <span className="font-semibold tabular-nums">{doc.riskScore}</span>
          <span className="text-muted/70">/</span>
          <span>100</span>
        </span>
        <span className="hidden text-xs text-muted lg:inline-flex">
          {doc.flags} flag{doc.flags === 1 ? "" : "s"}
        </span>
        <span className={`badge ${statusBadge[doc.status]}`}>{doc.status}</span>
      </div>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted transition group-hover:text-ink" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
