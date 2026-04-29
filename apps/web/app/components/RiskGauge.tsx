import type { RiskClassification } from "../lib/types";

interface RiskGaugeProps {
  score: number;
  level: RiskClassification;
  size?: number;
  strokeWidth?: number;
}

const labels: Record<RiskClassification, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

const palette: Record<RiskClassification, { ring: string; track: string; text: string }> = {
  low: {
    ring: "#16a34a",
    track: "#dcfce7",
    text: "#15803d",
  },
  medium: {
    ring: "#d97706",
    track: "#fef3c7",
    text: "#b45309",
  },
  high: {
    ring: "#dc2626",
    track: "#fee2e2",
    text: "#b91c1c",
  },
};

export function RiskGauge({ score, level, size = 132, strokeWidth = 12 }: RiskGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (clamped / 100) * circumference;
  const colors = palette[level];

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.2,.7,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Risk score</p>
        <p className="mt-0.5 text-4xl font-bold tabular-nums" style={{ color: colors.text }}>
          {clamped}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
          {labels[level]}
        </p>
      </div>
    </div>
  );
}
