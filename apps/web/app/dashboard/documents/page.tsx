import { getSession } from "../../lib/session";
import { DashboardTopbar } from "../components/DashboardTopbar";
import { DocumentsTable } from "../components/DocumentsTable";
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
        subtitle={`${demoDocuments.length} reviews / sorted by most recent`}
        title="Documents"
      />

      <div className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6">
        <DocumentsTable documents={demoDocuments} />
      </div>
    </>
  );
}
