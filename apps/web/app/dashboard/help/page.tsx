import { getSession } from "../../lib/session";
import { DashboardTopbar } from "../components/DashboardTopbar";

const faqs = [
  {
    q: "What file types can I upload?",
    a: "PDF, DOCX, PNG, JPG, and WEBP. We extract text directly from PDFs and Word documents, and use vision OCR for images.",
  },
  {
    q: "How is the risk score calculated?",
    a: "A weighted rule engine scores 7 common patterns (auto-renewal, cancellation penalties, hidden fees, non-compete, lock-in, liability imbalance, arbitration). Scores combine to produce 0–100. With an OpenAI key, we layer model judgement on top.",
  },
  {
    q: "Are my contracts stored?",
    a: "In demo mode, sessions stay in this browser only. We never persist contracts to a server.",
  },
  {
    q: "How many follow-up questions can I ask?",
    a: "Three free follow-ups per review. Cheka Pro (coming soon) unlocks unlimited follow-ups and saved review history.",
  },
];

export default async function HelpPage() {
  const session = await getSession();

  return (
    <>
      <DashboardTopbar
        breadcrumbs={[
          { label: session?.workspace ?? "Workspace", href: "/dashboard" },
          { label: "Help" },
        ]}
        subtitle="FAQs, contact, and what to do when something looks off"
        title="Help & support"
      />

      <div className="flex-1 px-6 py-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="surface overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Frequently asked</h2>
            </div>
            <ul className="divide-y divide-line">
              {faqs.map((item) => (
                <li className="px-4 py-4" key={item.q}>
                  <p className="text-sm font-semibold text-ink">{item.q}</p>
                  <p className="mt-1.5 text-xs leading-5 text-muted">{item.a}</p>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4">
            <div className="surface p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Contact</h3>
              <p className="mt-2 text-sm text-ink">Reach out anytime — we usually reply within 24 hours.</p>
              <a className="btn-secondary mt-3 w-full px-3 py-2 text-xs" href="mailto:hello@cheka.app">
                Email hello@cheka.app
              </a>
            </div>
            <div className="surface p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Status</h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-ink">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                All systems operational
              </p>
              <p className="mt-1 text-xs text-muted">No incidents reported in the last 30 days.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
