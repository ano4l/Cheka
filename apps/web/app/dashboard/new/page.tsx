import type { Metadata } from "next";

import { PreviewStudio } from "../../components/PreviewStudio";
import { getSession } from "../../lib/session";
import { DashboardTopbar } from "../components/DashboardTopbar";

export const metadata: Metadata = {
  title: "New review - Cheka",
};

export default async function NewReviewPage() {
  const session = await getSession();

  return (
    <>
      <DashboardTopbar
        breadcrumbs={[
          { label: session?.workspace ?? "Workspace", href: "/dashboard" },
          { label: "New review" },
        ]}
        subtitle="Upload first, confirm next, then review the results"
        title="New contract review"
      />

      <div className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6">
        <PreviewStudio />
      </div>
    </>
  );
}
