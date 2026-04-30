interface KpiCardProps {
  label: string;
  value: string;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  hint?: string;
  icon?: React.ReactNode;
}

const trendColor: Record<"up" | "down" | "flat", string> = {
  up: "text-emerald-700 bg-emerald-50/80 border-emerald-200/80",
  down: "text-rose-700 bg-rose-50/80 border-rose-200/80",
  flat: "text-muted bg-white/70 border-white/80",
};

const trendArrow: Record<"up" | "down" | "flat", string> = {
  up: "M5 15l7-7 7 7",
  down: "M19 9l-7 7-7-7",
  flat: "M5 12h14",
};

export function KpiCard({ label, value, delta, hint, icon }: KpiCardProps) {
  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/70 text-muted backdrop-blur">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink tabular-nums sm:text-3xl">{value}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {delta ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${trendColor[delta.trend]}`}
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
