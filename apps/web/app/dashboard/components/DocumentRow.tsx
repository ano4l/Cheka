import Link from "next/link";

import type { DemoDocument } from "./seed-data";

const riskBadge: Record<DemoDocument["riskLevel"], string> = {
  low: "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
  medium: "border-amber-200/80 bg-amber-50/80 text-amber-800",
  high: "border-rose-200/80 bg-rose-50/80 text-rose-800",
};

const statusBadge: Record<DemoDocument["status"], string> = {
  Reviewed: "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
  "Awaiting payment": "border-amber-200/80 bg-amber-50/80 text-amber-800",
  Processing: "border-sky-200/80 bg-sky-50/80 text-sky-800",
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
      className="group flex items-center gap-3 px-4 py-3 transition hover:bg-white/55 sm:gap-4"
      href={`/dashboard/documents/${doc.id}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/65 text-base backdrop-blur">
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
      {/* Compact mobile risk pill */}
      <span className={`badge md:hidden ${riskBadge[doc.riskLevel]}`}>
        <span className="font-semibold tabular-nums">{doc.riskScore}</span>
      </span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted transition group-hover:text-ink" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
