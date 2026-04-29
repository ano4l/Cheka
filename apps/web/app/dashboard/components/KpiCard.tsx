interface KpiCardProps {
  label: string;
  value: string;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  hint?: string;
  icon?: React.ReactNode;
}

const trendColor: Record<"up" | "down" | "flat", string> = {
  up: "text-emerald-700 bg-emerald-50 border-emerald-200",
  down: "text-rose-700 bg-rose-50 border-rose-200",
  flat: "text-muted bg-canvas border-line",
};

const trendArrow: Record<"up" | "down" | "flat", string> = {
  up: "M5 15l7-7 7 7",
  down: "M19 9l-7 7-7-7",
  flat: "M5 12h14",
};

export function KpiCard({ label, value, delta, hint, icon }: KpiCardProps) {
  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
        {icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-canvas text-muted">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold text-ink tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {delta ? (
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${trendColor[delta.trend]}`}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path strokeLinecap="round" strokeLinejoin="round" d={trendArrow[delta.trend]} />
            </svg>
            {delta.value}
          </span>
        ) : null}
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
    </div>
  );
}
