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

      <div className="flex-1 px-6 py-6">
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <nav className="space-y-1 text-sm">
            {["Profile", "Workspace", "Notifications", "Integrations", "Billing", "API access"].map((item, idx) => (
              <button
                className={`block w-full rounded-md px-3 py-2 text-left transition ${
                  idx === 0 ? "bg-accent-soft font-medium text-accent-strong" : "text-muted hover:bg-canvas hover:text-ink"
                }`}
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="space-y-5">
            <div className="surface p-5">
              <h2 className="text-sm font-semibold text-ink">Profile</h2>
              <p className="mt-0.5 text-xs text-muted">Update how you appear in this workspace.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="label">Display name</span>
                  <input className="input" defaultValue={session?.name} />
                </label>
                <label className="space-y-1">
                  <span className="label">Email</span>
                  <input className="input" defaultValue={session?.email} disabled />
                </label>
                <label className="space-y-1">
                  <span className="label">Workspace</span>
                  <input className="input" defaultValue={session?.workspace} />
                </label>
                <label className="space-y-1">
                  <span className="label">Default market</span>
                  <select className="input">
                    <option>South Africa</option>
                    <option>Kenya</option>
                  </select>
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button className="btn-ghost text-xs" type="button">
                  Cancel
                </button>
                <button className="btn-primary px-3 py-1.5 text-xs" type="button">
                  Save changes
                </button>
              </div>
            </div>

            <div className="surface p-5">
              <h2 className="text-sm font-semibold text-ink">OpenAI API key</h2>
              <p className="mt-0.5 text-xs text-muted">
                Bring your own key for higher-quality summaries and follow-ups. Without one, Cheka falls back to the
                rule-based engine.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input className="input flex-1 font-mono text-xs" placeholder="sk-…" type="password" />
                <button className="btn-secondary px-3 py-2 text-xs" type="button">
                  Save key
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">Stored in your workspace and never logged.</p>
            </div>

            <div className="surface p-5">
              <h2 className="text-sm font-semibold text-rose-700">Danger zone</h2>
              <p className="mt-0.5 text-xs text-muted">Permanently sign out of this browser session.</p>
              <form action="/sign-out" className="mt-3" method="post">
                <button
                  className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
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
