"use client";

import Link from "next/link";

interface DashboardTopbarProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function DashboardTopbar({ title, subtitle, breadcrumbs, primaryAction }: DashboardTopbarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-1 text-xs text-muted">
              {breadcrumbs.map((crumb, idx) => (
                <span className="flex items-center gap-1" key={idx}>
                  {crumb.href ? (
                    <Link className="transition hover:text-ink" href={crumb.href}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-muted">{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 ? (
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                    </svg>
                  ) : null}
                </span>
              ))}
            </nav>
          ) : null}
          <h1 className="truncate text-base font-semibold text-ink">{title}</h1>
          {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="hidden h-8 items-center gap-2 rounded-md border border-line bg-white px-2.5 text-xs text-muted transition hover:border-slate-300 hover:bg-canvas md:inline-flex"
            type="button"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <span>Search</span>
            <kbd className="rounded border border-line bg-canvas px-1 font-mono text-[10px]">⌘K</kbd>
          </button>
          <button
            aria-label="Notifications"
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-slate-300 hover:bg-canvas"
            type="button"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14V11a6 6 0 10-12 0v3a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
            </svg>
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          {primaryAction ? (
            primaryAction.href ? (
              <Link className="btn-primary h-8 px-3 text-xs" href={primaryAction.href}>
                {primaryAction.label}
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                </svg>
              </Link>
            ) : (
              <button className="btn-primary h-8 px-3 text-xs" onClick={primaryAction.onClick} type="button">
                {primaryAction.label}
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
