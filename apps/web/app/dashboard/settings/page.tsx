import { getSession } from "../../lib/session";
import { DashboardTopbar } from "../components/DashboardTopbar";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <>
      <DashboardTopbar
        breadcrumbs={[
          { label: session?.workspace ?? "Workspace", href: "/dashboard" },
          { label: "Settings" },
        ]}
        subtitle="Workspace preferences, integrations, and billing"
        title="Settings"
      />

      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:gap-5">
          <nav className="flex gap-2 overflow-x-auto pb-1 text-sm scrollbar-none lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {["Profile", "Workspace", "Notifications", "Integrations", "Billing", "API access"].map((item, idx) => (
              <button
                className={`shrink-0 rounded-full px-3 py-2 text-left transition no-tap-highlight lg:w-full ${
                  idx === 0
                    ? "bg-ink font-medium text-white shadow-soft"
                    : "text-muted hover:bg-white/55 hover:text-ink"
                }`}
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="space-y-4 lg:space-y-5">
            <div className="glass p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-ink">Profile</h2>
              <p className="mt-0.5 text-xs text-muted">Update how you appear in this workspace.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="label">Display name</span>
                  <input className="input-glass" defaultValue={session?.name} />
                </label>
                <label className="space-y-1">
                  <span className="label">Email</span>
                  <input className="input-glass" defaultValue={session?.email} disabled />
                </label>
                <label className="space-y-1">
                  <span className="label">Workspace</span>
                  <input className="input-glass" defaultValue={session?.workspace} />
                </label>
                <label className="space-y-1">
                  <span className="label">Default market</span>
                  <select className="input-glass">
                    <option>South Africa</option>
                    <option>Kenya</option>
                  </select>
                </label>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button className="btn-ghost px-3 py-1.5 text-xs" type="button">
                  Cancel
                </button>
                <button className="btn-primary px-3 py-1.5 text-xs" type="button">
                  Save changes
                </button>
              </div>
            </div>

            <div className="glass p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-ink">OpenAI API key</h2>
              <p className="mt-0.5 text-xs text-muted">
                Bring your own key for higher-quality summaries and follow-ups. Without one, Cheka falls back to the
                rule-based engine.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input className="input-glass flex-1 font-mono text-xs" placeholder="sk-…" type="password" />
                <button className="btn-glass px-3 py-2 text-xs" type="button">
                  Save key
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">Stored in your workspace and never logged.</p>
            </div>

            <div className="glass p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-rose-700">Danger zone</h2>
              <p className="mt-0.5 text-xs text-muted">Permanently sign out of this browser session.</p>
              <form action="/sign-out" className="mt-3" method="post">
                <button
                  className="rounded-full border border-rose-200/70 bg-rose-50/70 px-4 py-1.5 text-xs font-medium text-rose-700 backdrop-blur transition hover:bg-rose-100/80"
                  type="submit"
                >
                  Sign out of Cheka
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
