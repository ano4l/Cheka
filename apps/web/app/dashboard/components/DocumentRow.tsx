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
  Lease: "LS",
  Employment: "EM",
  Service: "SV",
  NDA: "ND",
  Loan: "LN",
  SaaS: "SA",
};

const riskMeta: Record<DemoDocument["riskLevel"], { label: string; bar: string }> = {
  low: { label: "Low", bar: "bg-emerald-500" },
  medium: { label: "Medium", bar: "bg-amber-500" },
  high: { label: "High", bar: "bg-rose-500" },
};

interface Props {
  doc: DemoDocument;
}

export function DocumentRow({ doc }: Props) {
  return (
    <Link
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3.5 transition hover:bg-white/70 focus-visible:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[auto_minmax(0,1.3fr)_160px_110px_120px_auto] sm:gap-4 sm:px-5 sm:py-3"
      href={`/dashboard/documents/${doc.id}`}
    >
      <span className="icon-tile text-[11px] font-bold tracking-wide text-accent">{typeIcon[doc.type]}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
        <p className="truncate text-xs text-muted">
          {doc.type} / {doc.market} / {doc.shortReviewedAt}
        </p>
      </div>
      <div className="hidden min-w-0 sm:block">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-ink">{riskMeta[doc.riskLevel].label}</span>
          <span className="tabular-nums text-muted">{doc.riskScore}/100</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
          <div className={`h-full rounded-full ${riskMeta[doc.riskLevel].bar}`} style={{ width: `${doc.riskScore}%` }} />
        </div>
      </div>
      <span className="hidden text-xs text-muted sm:inline-flex">
        {doc.flags} flag{doc.flags === 1 ? "" : "s"}
      </span>
      <span className={`badge hidden justify-self-start sm:inline-flex ${statusBadge[doc.status]}`}>{doc.status}</span>
      <span className={`badge sm:hidden ${riskBadge[doc.riskLevel]}`}>
        <span className="font-semibold tabular-nums">{doc.riskScore}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
