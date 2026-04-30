import Link from "next/link";

import { getInitials, getSession } from "../../lib/session";
import { MobileSidebarDrawer } from "./DashboardSidebar";

interface DashboardTopbarProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: {
    label: string;
    href: string;
  };
}

export async function DashboardTopbar({ title, subtitle, breadcrumbs, primaryAction }: DashboardTopbarProps) {
  const session = await getSession();
  const initials = session ? getInitials(session.name) : "";

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {session ? (
            <MobileSidebarDrawer
              email={session.email}
              initials={initials}
              name={session.name}
              workspace={session.workspace}
            />
          ) : null}
          <div className="min-w-0">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="hidden items-center gap-1 text-[11px] text-muted sm:flex" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <span className="flex items-center gap-1" key={`${crumb.label}-${idx}`}>
                    {crumb.href ? (
                      <Link className="transition hover:text-ink" href={crumb.href}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span>{crumb.label}</span>
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
            <h1 className="truncate text-sm font-semibold text-ink sm:text-base">{title}</h1>
            {subtitle ? <p className="hidden truncate text-xs text-muted sm:block">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="hidden h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 text-xs text-muted backdrop-blur transition hover:bg-white hover:text-ink md:inline-flex"
            type="button"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <span>Search</span>
            <kbd className="rounded-full border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px]">Ctrl K</kbd>
          </button>
          <button
            aria-label="Notifications"
            className="touch-area relative inline-flex items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-muted backdrop-blur transition hover:bg-white hover:text-ink"
            type="button"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14V11a6 6 0 10-12 0v3a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
            </svg>
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          {primaryAction ? (
            <Link className="btn-primary h-9 px-3 text-xs sm:px-4 sm:text-sm" href={primaryAction.href}>
              <span className="hidden sm:inline">{primaryAction.label}</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
              </svg>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
