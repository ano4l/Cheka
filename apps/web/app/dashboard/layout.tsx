import { redirect } from "next/navigation";

import { getInitials, getSession } from "../lib/session";
import { DashboardSidebar } from "./components/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in?next=/dashboard");
  }
  const initials = getInitials(session.name);

  return (
    <div className="min-h-screen bg-cream-aurora">
      <div className="flex">
        <DashboardSidebar
          email={session.email}
          initials={initials}
          name={session.name}
          workspace={session.workspace}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
