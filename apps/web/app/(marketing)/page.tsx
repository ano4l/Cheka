import Link from "next/link";

const steps = [
  {
    n: 1,
    title: "Open your workspace",
    body: "Start in a demo workspace without a password or card.",
  },
  {
    n: 2,
    title: "Upload or paste",
    body: "Use PDF, Word, image, URL, or contract text.",
  },
  {
    n: 3,
    title: "Review the risk",
    body: "See the score, plain summary, and evidence behind each flag.",
  },
  {
    n: 4,
    title: "Ask follow-ups",
    body: "Ask practical questions about fees, renewal, cancellation, and signing.",
  },
];

const riskSignals = [
  { title: "Auto-renewal", weight: 18, body: "The contract continues unless cancelled in writing." },
  { title: "Cancellation penalty", weight: 16, body: "Exit fees that make leaving expensive." },
  { title: "Hidden fees", weight: 14, body: "Admin or service fees outside the headline price." },
  { title: "Non-compete", weight: 20, body: "Restrictions after the relationship ends." },
  { title: "Long lock-in", weight: 15, body: "Minimum terms that block early exits." },
  { title: "Liability imbalance", weight: 17, body: "One-sided indemnity or liability language." },
];

const heroFeatures = [
  "PDF, DOCX, image",
  "Risk score 0-100",
  "Evidence-backed flags",
  "Plain-language summary",
  "Follow-up questions",
  "Saved review history",
];

export default function Home() {
  return (
    <main className="bg-cream-aurora">
      <section className="app-shell pb-8 pt-10 sm:pb-12 sm:pt-16 lg:pt-20">
        <div className="glass-strong overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-5 sm:p-8 lg:p-10">
              <span className="badge border-white/70 bg-white/55 text-accent-strong backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
                AI contract review for South Africa and Kenya
              </span>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Know what a contract really says before you sign it.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Cheka extracts the contract, scores the risk, highlights the clauses that matter, and answers your
                follow-up questions in plain language.
              </p>
              <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                <Link className="btn-primary w-full px-5 py-2.5 text-sm sm:w-auto" href="/sign-in?next=/dashboard/new">
                  Open the dashboard
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                  </svg>
                </Link>
                <Link className="btn-glass w-full px-5 py-2.5 text-sm sm:w-auto" href="#how-it-works">
                  See how it works
                </Link>
              </div>
              <ul className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-2">
                {heroFeatures.map((item) => (
                  <li key={item} className="glass-panel flex items-center gap-2 px-3 py-2">
                    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-accent" fill="currentColor">
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

            <div className="border-t border-white/50 bg-white/18 p-4 sm:p-6 lg:border-l lg:border-t-0">
              <div className="glass overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/60 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-muted">Contract review</p>
                    <p className="text-sm font-semibold text-ink">Residential lease.pdf</p>
                  </div>
                  <span className="badge border-rose-200 bg-rose-50/80 text-rose-800">72/100</span>
                </div>
                <div className="space-y-3 p-4">
                  {[
                    ["Auto-renewal", "Tenant must cancel 30 days before renewal.", "High"],
                    ["Early exit fee", "Penalty applies if tenant leaves early.", "Medium"],
                    ["Service interruption", "Landlord liability is limited.", "Medium"],
                  ].map(([title, body, level]) => (
                    <div className="glass-panel p-3" key={title}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">{title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">{body}</p>
                        </div>
                        <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-semibold text-muted">
                          {level}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-xl bg-ink p-4 text-white shadow-elevated">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Summary</p>
                    <p className="mt-2 text-sm leading-6 text-white/90">
                      Review renewal, cancellation, and utility clauses before signing. Escalate if the penalty terms
                      cannot be negotiated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell py-8 sm:py-12" id="how-it-works">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Four steps from messy wording to a clear decision.
          </h2>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="glass p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/60 text-sm font-semibold text-ink backdrop-blur">
                {step.n}
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-shell py-8 sm:py-12" id="risk-factors">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="glass p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Risk factors</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              The patterns that quietly hurt people.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Cheka checks weighted rule signals first, then enriches the result with contract-aware explanations when
              AI is enabled.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              {[
                ["Low", "0-24", "text-emerald-700"],
                ["Medium", "25-59", "text-amber-700"],
                ["High", "60-100", "text-rose-700"],
              ].map(([label, range, color]) => (
                <div className="glass-panel p-3" key={label}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>{label}</p>
                  <p className="mt-1 font-semibold text-ink">{range}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass overflow-hidden p-2">
            <ul className="divide-y divide-white/50">
              {riskSignals.map((signal) => (
                <li key={signal.title} className="flex items-start gap-3 px-3 py-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200/70 bg-rose-50/80 text-[11px] font-semibold text-rose-700">
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

      <section className="app-shell pb-14 pt-8 sm:pb-20 sm:pt-12" id="pricing">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="glass p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Pricing</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Pay only when you actually need clarity.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Cheka starts pay-per-use so anyone can try it without a subscription. Pro features arrive as heavier-use
              workflows mature.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-strong p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Per review</p>
              <p className="mt-2 text-2xl font-semibold text-ink">ZAR 35 / KES 180</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {["Plain-language summary and risk score", "Red flags with evidence", "3 free follow-up questions"].map((item) => (
                  <li className="flex gap-2" key={item}>
                    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link className="btn-primary mt-5 w-full px-3 py-2 text-sm" href="/sign-in?next=/dashboard/new">
                Start a review
              </Link>
            </div>
            <div className="glass p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Cheka Pro / coming soon</p>
              <p className="mt-2 text-2xl font-semibold text-ink">Subscription</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {["Unlimited follow-up questions", "Saved review history and export", "Priority WhatsApp and mobile access"].map((item) => (
                  <li className="flex gap-2" key={item}>
                    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="currentColor">
                      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
