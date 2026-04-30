"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CheckaLogo } from "../../components/CheckaLogo";

interface DashboardSidebarProps {
  workspace: string;
  initials: string;
  name: string;
  email: string;
}

const primaryNav = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
    ),
  },
  {
    href: "/dashboard/new",
    label: "New review",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
  },
  {
    href: "/dashboard/documents",
    label: "Documents",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
    ),
  },
  {
    href: "/dashboard/history",
    label: "Activity",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
];

const secondaryNav = [
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.3 3.6a1.5 1.5 0 013.4 0l.2.9a7 7 0 011.5.9l.9-.3a1.5 1.5 0 011.8.7l.7 1.2a1.5 1.5 0 01-.3 1.9l-.7.6c.1.5.1 1 0 1.5l.7.6a1.5 1.5 0 01.3 1.9l-.7 1.2a1.5 1.5 0 01-1.8.7l-.9-.3c-.5.4-1 .7-1.5.9l-.2.9a1.5 1.5 0 01-3.4 0l-.2-.9a7 7 0 01-1.5-.9l-.9.3a1.5 1.5 0 01-1.8-.7l-.7-1.2a1.5 1.5 0 01.3-1.9l.7-.6a7 7 0 010-1.5l-.7-.6a1.5 1.5 0 01-.3-1.9l.7-1.2a1.5 1.5 0 011.8-.7l.9.3c.5-.4 1-.7 1.5-.9l.2-.9zM12 14a2 2 0 100-4 2 2 0 000 4z"
      />
    ),
  },
  {
    href: "/dashboard/help",
    label: "Help & support",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.1 9.1a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarBody({ initials, name, workspace, email, onNavigate }: DashboardSidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-white/40 px-4">
        <CheckaLogo className="h-7 w-7" />
        <span className="text-base font-semibold tracking-tight text-ink">Cheka</span>
        <span className="ml-auto rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
          Beta
        </span>
      </div>

      <button
        className="mx-3 mt-3 flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-2 text-left text-xs text-muted transition hover:bg-white/85 hover:text-ink no-tap-highlight"
        type="button"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <span className="flex-1 truncate">Search…</span>
        <kbd className="rounded-full border border-white/80 bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-muted">⌘K</kbd>
      </button>

      <nav className="mt-4 flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Workspace</p>
        <ul className="space-y-0.5">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  className={`group flex items-center gap-2.5 rounded-full px-3 py-2 text-sm transition no-tap-highlight ${
                    active
                      ? "bg-ink text-white shadow-soft"
                      : "text-muted hover:bg-white/70 hover:text-ink"
                  }`}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 ${active ? "text-white" : "text-muted group-hover:text-ink"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    {item.icon}
                  </svg>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.href === "/dashboard/new" && !active ? (
                    <span className="rounded-full bg-butter-soft px-2 py-0.5 text-[10px] font-semibold text-butter-deep">+</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Account</p>
        <ul className="space-y-0.5">
          {secondaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  className={`group flex items-center gap-2.5 rounded-full px-3 py-2 text-sm transition no-tap-highlight ${
                    active
                      ? "bg-ink text-white shadow-soft"
                      : "text-muted hover:bg-white/70 hover:text-ink"
                  }`}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 ${active ? "text-white" : "text-muted group-hover:text-ink"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    {item.icon}
                  </svg>
                  <span className="flex-1 font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 rounded-2xl border border-white/60 bg-white/55 p-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Credits</p>
            <span className="text-xs font-semibold text-ink">3 of 5</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
            <div className="h-full w-3/5 rounded-full bg-butter" />
          </div>
          <p className="mt-2 text-[11px] leading-4 text-muted">
            Free trial credits. Add a payment method for unlimited reviews.
          </p>
          <button className="btn-glass mt-2.5 w-full px-3 py-1.5 text-xs" type="button">
            Add credits
          </button>
        </div>
      </nav>

      <div className="border-t border-white/40 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-full bg-white/55 p-1.5 pr-2 backdrop-blur">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            <p className="truncate text-[11px] text-muted">{workspace}</p>
          </div>
          <form action="/sign-out" method="post">
            <button
              aria-label={`Sign out ${email}`}
              className="rounded-full p-2 text-muted transition hover:bg-white/70 hover:text-ink touch-area"
              title="Sign out"
              type="submit"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4 4m-4-4l4-4M9 4h9a2 2 0 012 2v12a2 2 0 01-2 2H9" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-white/40 bg-white/45 backdrop-blur-xl lg:sticky lg:top-0 lg:block">
      <SidebarBody {...props} />
    </aside>
  );
}

export function MobileSidebarDrawer(props: DashboardSidebarProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-label="Open navigation"
        className="touch-area inline-flex items-center justify-center rounded-full border border-white/60 bg-white/70 text-muted transition hover:text-ink lg:hidden"
        onClick={() => setOpen(true)}
        type="button"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-white/40 bg-cream-aurora shadow-glass-lg animate-fade-up">
            <button
              aria-label="Close navigation"
              className="touch-area absolute right-2 top-2 z-10 inline-flex items-center justify-center rounded-full bg-white/70 text-muted hover:text-ink"
              onClick={() => setOpen(false)}
              type="button"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
            <SidebarBody {...props} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
