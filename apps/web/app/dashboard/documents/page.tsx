import { getSession } from "../../lib/session";
import { DashboardTopbar } from "../components/DashboardTopbar";
import { DocumentRow } from "../components/DocumentRow";
import { demoDocuments } from "../components/seed-data";

export default async function DocumentsPage() {
  const session = await getSession();

  return (
    <>
      <DashboardTopbar
        breadcrumbs={[
          { label: session?.workspace ?? "Workspace", href: "/dashboard" },
          { label: "Documents" },
        ]}
        primaryAction={{ label: "New review", href: "/dashboard/new" }}
        subtitle={`${demoDocuments.length} reviews · sorted by most recent`}
        title="Documents"
      />

      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <div className="glass overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/40 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <button className="badge border-white/70 bg-ink text-white">All ({demoDocuments.length})</button>
              <button className="badge border-white/70 bg-white/65 text-muted hover:text-ink">High risk ({demoDocuments.filter((d) => d.riskLevel === "high").length})</button>
              <button className="badge border-white/70 bg-white/65 text-muted hover:text-ink">Awaiting payment ({demoDocuments.filter((d) => d.status === "Awaiting payment").length})</button>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <input className="input-glass h-9 flex-1 text-xs sm:w-56 sm:flex-none" placeholder="Search documents…" />
              <select className="input-glass h-9 w-32 text-xs">
                <option>Most recent</option>
                <option>Highest risk</option>
                <option>Most flags</option>
              </select>
            </div>
          </div>
          <ul className="divide-y divide-white/40">
            {demoDocuments.map((doc) => (
              <li key={doc.id}>
                <DocumentRow doc={doc} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
