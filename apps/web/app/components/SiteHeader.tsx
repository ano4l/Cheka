import Link from "next/link";

import { CheckaLogo } from "./CheckaLogo";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Risk factors", href: "/#risk-factors" },
  { label: "Pricing", href: "/#pricing" },
];

interface SiteHeaderProps {
  signedIn?: boolean;
  userName?: string;
  userEmail?: string;
}

function getInitials(name?: string) {
  if (!name) return "C";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";
}

export function SiteHeader({ signedIn, userName, userEmail }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/55 backdrop-blur-xl">
      <div className="app-shell flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link className="flex items-center gap-2.5" href="/">
          <CheckaLogo className="h-7 w-7" />
          <span className="text-base font-semibold tracking-tight text-ink">Cheka</span>
          <span className="hidden rounded-full border border-white/70 bg-white/65 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted backdrop-blur sm:inline-block">
            Beta
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              className="rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-white/55 hover:text-ink"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Link className="hidden text-sm text-muted transition hover:text-ink sm:inline-flex" href="/dashboard">
                Dashboard
              </Link>
              <Link className="btn-primary h-9 px-3 text-xs" href="/dashboard/new">
                New review
              </Link>
              <Link
                aria-label={`Open dashboard as ${userEmail ?? userName ?? "user"}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white transition hover:bg-slate-800"
                href="/dashboard"
                title={userName ?? userEmail}
              >
                {getInitials(userName)}
              </Link>
            </>
          ) : (
            <>
              <Link className="hidden text-sm text-muted transition hover:text-ink sm:inline-flex" href="/sign-in">
                Sign in
              </Link>
              <Link className="btn-primary h-9 px-3 text-xs sm:px-4" href="/sign-in?next=/dashboard/new">
                Review a contract
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
