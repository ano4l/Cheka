import type { Metadata } from "next";

import { AdminJobsStudio } from "../components/AdminJobsStudio";

export const metadata: Metadata = {
  title: "Cheka Admin | Internal Operations",
  description:
    "Internal Cheka operations view for job monitoring, refresh, and retry handling.",
};

export default function AdminPage() {
  return (
    <main className="app-shell py-8">
      <section className="surface overflow-hidden">
        <AdminJobsStudio />
      </section>
    </main>
  );
}
