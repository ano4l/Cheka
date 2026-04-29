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

      <div className="flex-1 px-6 py-6">
        <div className="surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <button className="badge border-line bg-canvas text-ink">All ({demoDocuments.length})</button>
              <button className="badge border-line bg-white text-muted hover:text-ink">High risk ({demoDocuments.filter((d) => d.riskLevel === "high").length})</button>
              <button className="badge border-line bg-white text-muted hover:text-ink">Awaiting payment ({demoDocuments.filter((d) => d.status === "Awaiting payment").length})</button>
            </div>
            <div className="flex items-center gap-2">
              <input className="input h-8 w-56 text-xs" placeholder="Search documents…" />
              <select className="input h-8 w-32 text-xs">
                <option>Most recent</option>
                <option>Highest risk</option>
                <option>Most flags</option>
              </select>
            </div>
          </div>
          <ul className="divide-y divide-line">
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
