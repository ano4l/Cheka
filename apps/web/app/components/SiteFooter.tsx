import { CheckaLogo } from "./CheckaLogo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="app-shell flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <CheckaLogo className="h-6 w-6" />
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">Cheka</span> · Contract clarity for everyday people · South Africa & Kenya
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span>© {new Date().getFullYear()} Cheka</span>
          <a className="transition hover:text-ink" href="#preview-studio">
            Review
          </a>
          <a className="transition hover:text-ink" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-ink" href="#pricing">
            Pricing
          </a>
          <span className="hidden md:inline">Cheka provides guidance, not legal representation.</span>
        </div>
      </div>
    </footer>
  );
}
