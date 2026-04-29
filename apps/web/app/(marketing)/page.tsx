import Link from "next/link";

const steps = [
  {
    n: 1,
    title: "Sign in to your workspace",
    body: "Spin up a demo workspace in seconds — no password, no credit card needed.",
  },
  {
    n: 2,
    title: "Upload the contract",
    body: "PDF, Word, image, or pasted text. Cheka extracts and normalises the content.",
  },
  {
    n: 3,
    title: "Read the structured review",
    body: "Plain-language summary, risk score 0–100, key obligations, and clauses that need attention.",
  },
  {
    n: 4,
    title: "Ask follow-up questions",
    body: "Three free, contract-aware follow-ups about cancellation, fees, renewal, or whether it's safe to sign.",
  },
];

const riskSignals = [
  { title: "Auto-renewal", weight: 18, body: "The contract continues automatically unless cancelled in writing." },
  { title: "Cancellation penalty", weight: 16, body: "Termination fees and exit costs that make leaving expensive." },
  { title: "Hidden fees", weight: 14, body: "Service charges and admin fees billed separately from the headline price." },
  { title: "Non-compete", weight: 20, body: "Post-relationship restrictions on work or business activity." },
  { title: "Long-term lock-in", weight: 15, body: "Minimum terms and fixed commitments that block early exits." },
  { title: "Liability imbalance", weight: 17, body: "Indemnity language that pushes risk onto one party only." },
];

export default function Home() {
  return (
    <main>
      <section className="border-b border-line bg-white">
        <div className="app-shell py-12 sm:py-16">
          <div className="max-w-3xl">
            <span className="badge border-accent/30 bg-accent-soft text-accent-strong">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
              AI-powered contract review · South Africa & Kenya
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Know what a contract really says before you sign it.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Upload a contract — PDF, Word, image, or pasted text. Cheka extracts the content, scores the risk,
              highlights the clauses that matter, and answers your questions in plain language.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link className="btn-primary px-4 py-2.5 text-sm" href="/sign-in?next=/dashboard/new">
                Open the dashboard
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                </svg>
              </Link>
              <Link className="btn-secondary px-4 py-2.5 text-sm" href="#how-it-works">
                See how it works
              </Link>
            </div>

            <ul className="mt-7 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted sm:grid-cols-3">
              {[
                "PDF, DOCX, image",
                "Risk score 0–100",
                "Red flags & evidence",
                "Plain-language summary",
                "3 free follow-ups",
                "Pay-per-use checkout",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Dashboard preview — visual taste of what you get after signing in */}
      <section className="app-shell py-10 sm:py-14" id="dashboard-preview">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Dashboard preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              A workspace built around clarity, not paperwork.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Sign in and you land in a workspace with quick actions, your past reviews, and a shortcut to
              upload a new contract. Every review is a clean record — risk score, evidence, and follow-up
              answers in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link className="btn-primary px-3.5 py-2 text-sm" href="/sign-in?next=/dashboard">
                Open dashboard
              </Link>
              <Link className="btn-secondary px-3.5 py-2 text-sm" href="/sign-in?next=/dashboard/new">
                Try a sample contract
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted">No password — demo workspace ready in 2 seconds.</p>
          </div>

          <div className="surface overflow-hidden shadow-soft">
            {/* Mock dashboard preview */}
            <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="ml-3 truncate text-[11px] text-muted">cheka.app/dashboard</span>
            </div>
            <div className="flex">
              <div className="hidden w-40 shrink-0 border-r border-line bg-white p-3 sm:block">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-accent" />
                  <span className="text-xs font-semibold text-ink">Cheka</span>
                </div>
                <div className="mt-3 space-y-1 text-[11px]">
                  <div className="rounded-md bg-accent-soft px-2 py-1 font-medium text-accent-strong">Overview</div>
                  <div className="px-2 py-1 text-muted">New review</div>
                  <div className="px-2 py-1 text-muted">Documents</div>
                  <div className="px-2 py-1 text-muted">Activity</div>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { l: "Reviews", v: "6" },
                    { l: "Avg risk", v: "49" },
                    { l: "Flags", v: "20" },
                    { l: "Credits", v: "3" },
                  ].map((kpi) => (
                    <div className="rounded-lg border border-line bg-white p-2.5" key={kpi.l}>
                      <p className="text-[9px] uppercase tracking-wider text-muted">{kpi.l}</p>
                      <p className="mt-0.5 text-lg font-bold text-ink">{kpi.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-line bg-white">
                  <div className="border-b border-line px-3 py-2 text-xs font-semibold text-ink">Recent documents</div>
                  <ul className="divide-y divide-line text-[11px]">
                    {[
                      { n: "Hodari Realty · 12-month lease.pdf", r: 72, c: "bg-rose-50 text-rose-800 border-rose-200" },
                      { n: "BrightPath services agreement.docx", r: 41, c: "bg-amber-50 text-amber-800 border-amber-200" },
                      { n: "Junior dev offer letter.pdf", r: 18, c: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                    ].map((row) => (
                      <li className="flex items-center gap-2 px-3 py-2" key={row.n}>
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-canvas text-[10px]">
                          📄
                        </span>
                        <span className="min-w-0 flex-1 truncate text-ink">{row.n}</span>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${row.c}`}>
                          {row.r}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell py-12" id="how-it-works">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
            Four steps from a messy contract to a clear decision.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="surface p-5 shadow-soft">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-canvas text-sm font-semibold text-muted">
                {step.n}
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-shell py-12" id="risk-factors">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Risk factors</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              The patterns that quietly hurt people.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              A weighted rule engine flags the clauses we see most often in consumer and SME contracts. When an
              OpenAI API key is configured, the rules combine with model judgement for plain-language summaries
              and contract-aware follow-ups.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              <div className="surface p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Low</p>
                <p className="mt-1 font-semibold text-ink">0 – 24</p>
              </div>
              <div className="surface p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Medium</p>
                <p className="mt-1 font-semibold text-ink">25 – 59</p>
              </div>
              <div className="surface p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">High</p>
                <p className="mt-1 font-semibold text-ink">60 – 100</p>
              </div>
            </div>
          </div>

          <div className="surface p-2">
            <ul className="divide-y divide-line">
              {riskSignals.map((signal) => (
                <li key={signal.title} className="flex items-start gap-3 px-3 py-3">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-700">
                    +{signal.weight}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{signal.title}</p>
                    <p className="text-xs leading-5 text-muted">{signal.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="app-shell py-12" id="pricing">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Pricing</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              Pay only when you actually need clarity.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Cheka starts pay-per-use so anyone can try it without a subscription. A heavier-use tier unlocks
              unlimited follow-ups and saved history when the wider product launches.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface p-5 shadow-soft">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Per review</p>
              <p className="mt-2 text-2xl font-semibold text-ink">ZAR 35 · KES 180</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Plain-language summary & risk score
                </li>
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Red flags with verbatim evidence
                </li>
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  3 free follow-up questions
                </li>
              </ul>
              <Link className="btn-primary mt-5 w-full px-3 py-2 text-sm" href="/sign-in?next=/dashboard/new">
                Start a review
              </Link>
            </div>
            <div className="surface p-5 shadow-soft">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Cheka Pro · coming soon
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">Subscription</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited follow-up questions
                </li>
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Saved review history & export
                </li>
                <li className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Priority WhatsApp & mobile access
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
