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

      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:gap-5">
          <div className="glass overflow-hidden">
            <div className="border-b border-white/40 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-ink">Frequently asked</h2>
            </div>
            <ul className="divide-y divide-white/40">
              {faqs.map((item) => (
                <li className="px-4 py-4 sm:px-5" key={item.q}>
                  <p className="text-sm font-semibold text-ink">{item.q}</p>
                  <p className="mt-1.5 text-xs leading-5 text-muted sm:text-sm sm:leading-6">{item.a}</p>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4">
            <div className="glass p-4 sm:p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Contact</h3>
              <p className="mt-2 text-sm text-ink">Reach out anytime — we usually reply within 24 hours.</p>
              <a className="btn-glass mt-3 w-full px-3 py-2 text-xs" href="mailto:hello@cheka.app">
                Email hello@cheka.app
              </a>
            </div>
            <div className="glass p-4 sm:p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Status</h3>
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
