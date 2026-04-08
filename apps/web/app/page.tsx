import { PreviewStudio } from "./components/PreviewStudio";

const channels = [
  {
    title: "Upload on the web",
    description:
      "A guided upload and checkout flow for PDFs, DOCX files, images, and public links.",
  },
  {
    title: "Send it on WhatsApp",
    description:
      "The primary access point for mobile-first users who want results in the same chat thread.",
  },
  {
    title: "Pick it up on mobile",
    description:
      "A companion app for document sharing, saved history, and future subscription features.",
  },
];

const riskSignals = [
  "Auto-renewal clauses that quietly extend commitments",
  "Cancellation penalties that make leaving expensive",
  "Hidden fees, lock-ins, and one-sided liability language",
  "Non-compete or arbitration clauses that limit user options",
];

const steps = [
  "Submit a contract by file upload, URL, or chat.",
  "Complete pay-per-use checkout before processing starts.",
  "Receive a clear summary, key points, risk score, and red flags.",
];

export default function Home() {
  return (
    <main className="cheka-shell">
      <section className="cheka-card overflow-hidden">
        <div className="grid gap-12 px-8 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-14">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-moss">
              Launch target: 1 May 2026
            </div>
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
                Know Before You Sign
              </p>
              <h1 className="max-w-3xl text-5xl leading-tight text-ink sm:text-6xl">
                Contract clarity for people who do not have a lawyer on speed dial.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-ink/75">
                Cheka translates dense agreements into plain language, highlights
                the clauses that matter, and gives everyday users the confidence to
                pause before signing.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                className="rounded-full bg-moss px-6 py-3 text-center font-semibold text-sand transition hover:bg-ink"
                href="#preview-studio"
              >
                Try the preview flow
              </a>
              <a
                className="rounded-full border border-ink/15 bg-white/60 px-6 py-3 text-center font-semibold text-ink transition hover:bg-white"
                href="#product-flow"
              >
                See launch scope
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-clay">
                  Markets
                </p>
                <p className="mt-3 text-xl font-semibold text-ink">
                  South Africa + Kenya
                </p>
              </div>
              <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-clay">
                  Free follow-up
                </p>
                <p className="mt-3 text-xl font-semibold text-ink">
                  3 questions per contract
                </p>
              </div>
              <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-clay">
                  Commercial model
                </p>
                <p className="mt-3 text-xl font-semibold text-ink">
                  Pay-per-use first
                </p>
              </div>
            </div>
          </div>

          <PreviewStudio />
        </div>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-3" id="launch-focus">
        {channels.map((channel) => (
          <article key={channel.title} className="cheka-card p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-clay">
              Channel
            </p>
            <h2 className="mt-4 text-3xl text-ink">{channel.title}</h2>
            <p className="mt-4 text-base leading-7 text-ink/75">
              {channel.description}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 py-4 lg:grid-cols-[0.9fr_1.1fr]" id="product-flow">
        <article className="cheka-card p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-clay">
            Product flow
          </p>
          <h2 className="mt-4 text-4xl text-ink">
            Built for fast clarity, not legal theatre.
          </h2>
          <ol className="mt-8 space-y-4">
            {steps.map((step, index) => (
              <li
                key={step}
                className="rounded-3xl border border-ink/10 bg-white/70 p-4 text-base leading-7 text-ink/80"
              >
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-coral/15 font-semibold text-coral">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </article>

        <article className="cheka-card p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-clay">
            Risk engine
          </p>
          <h2 className="mt-4 text-4xl text-ink">
            Hybrid intelligence that flags what ordinary readers usually miss.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {riskSignals.map((signal) => (
              <div
                key={signal}
                className="rounded-3xl border border-ink/10 bg-white/70 p-5 text-base leading-7 text-ink/80"
              >
                {signal}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-dashed border-ink/15 bg-white/50 p-5 text-sm leading-7 text-ink/70">
            Launch scoring bands: low 0-24, medium 25-59, high 60-100.
          </div>
        </article>
      </section>
    </main>
  );
}
