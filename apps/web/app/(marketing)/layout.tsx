import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { getSession } from "../lib/session";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <SiteHeader
        signedIn={Boolean(session)}
        userName={session?.name}
        userEmail={session?.email}
      />
      {children}
      <SiteFooter />
    </>
  );
}
