import type { Metadata } from "next";

import { PreviewStudio } from "../../components/PreviewStudio";
import { getSession } from "../../lib/session";
import { DashboardTopbar } from "../components/DashboardTopbar";

export const metadata: Metadata = {
  title: "New review · Cheka",
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
        subtitle="Drop a contract or paste text · risk score, red flags, and follow-up answers in one pass"
        title="Start a new contract review"
      />

      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_300px] xl:gap-5">
          <div className="min-w-0">
            <PreviewStudio />
          </div>

          <aside className="space-y-4">
            <div className="glass p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink">What happens next</h2>
              <ol className="mt-3 space-y-3 text-xs text-muted">
                {[
                  ["1", "Upload", "Drop a PDF, DOCX, image, or paste text. We extract & normalise the content."],
                  ["2", "Confirm", "A demo checkout unlocks the analysis. No real charge in this preview."],
                  ["3", "Review", "Risk score, red flags with verbatim evidence, and a plain-language summary."],
                  ["4", "Ask", "Three free follow-up questions per review, contract-aware."],
                ].map(([num, title, body]) => (
                  <li className="flex items-start gap-3" key={num}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/65 text-[10px] font-semibold text-ink backdrop-blur">
                      {num}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink">{title}</p>
                      <p className="mt-0.5 leading-5">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="glass p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink">Demo limits</h2>
              <ul className="mt-2.5 space-y-1.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Files up to 8 MB
                </li>
                <li className="flex items-start gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  3 follow-ups per review
                </li>
                <li className="flex items-start gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Sessions stay in this browser
                </li>
              </ul>
            </div>

            <div className="glass p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink">Need a hand?</h2>
              <p className="mt-1.5 text-xs leading-5 text-muted">
                Cheka provides guidance, not legal representation. For high-risk contracts, escalate to a lawyer
                before signing.
              </p>
              <a
                className="mt-3 inline-flex text-xs font-medium text-accent hover:text-accent-strong"
                href="mailto:hello@cheka.app"
              >
                Contact our team →
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
