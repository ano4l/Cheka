"use client";

import { startTransition, useState } from "react";

import {
  askFollowUp,
  confirmPayment,
  createPreviewJob,
  sampleContracts,
  usingExternalApi,
} from "../lib/preview-demo";
import type { ContractJobResponse, InputType, Market, RiskClassification } from "../lib/types";

const marketLabels: Record<Market, string> = {
  south_africa: "South Africa",
  kenya: "Kenya",
};

const inputLabels: Record<InputType, string> = {
  pdf: "PDF",
  docx: "DOCX",
  image: "Image",
  url: "Public URL",
};

const riskStyles: Record<RiskClassification, string> = {
  low: "border-emerald-600/20 bg-emerald-50 text-emerald-800",
  medium: "border-amber-500/20 bg-amber-50 text-amber-800",
  high: "border-rose-500/20 bg-rose-50 text-rose-800",
};

const starterSample = sampleContracts[0]!;

function getFriendlyError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong while preparing the preview. Please try again.";
}

export function PreviewStudio() {
  const [sourceName, setSourceName] = useState(starterSample.source_name);
  const [inputType, setInputType] = useState<InputType>(starterSample.input_type);
  const [market, setMarket] = useState<Market>(starterSample.market);
  const [customerEmail, setCustomerEmail] = useState("");
  const [text, setText] = useState(starterSample.text);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(true);
  const [job, setJob] = useState<ContractJobResponse | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const demoMode = !usingExternalApi();

  function runTask(task: () => Promise<void>) {
    setIsPending(true);
    startTransition(() => {
      void task().finally(() => {
        setIsPending(false);
      });
    });
  }

  function applySample(sampleId: string) {
    const sample = sampleContracts.find((item) => item.id === sampleId);
    if (!sample) return;

    setSourceName(sample.source_name);
    setInputType(sample.input_type);
    setMarket(sample.market);
    setText(sample.text);
    setCustomerEmail("");
    setDisclaimerAccepted(true);
    setJob(null);
    setFollowUpQuestion("");
    setFeedback(`Loaded "${sample.title}" into the preview studio.`);
    setError(null);
  }

  function handleCreatePreview() {
    if (!disclaimerAccepted) {
      setError("Users must accept the disclaimer before Cheka can unlock analysis.");
      return;
    }

    runTask(async () => {
      try {
        const created = await createPreviewJob({
          input_type: inputType,
          market,
          text,
          source_name: sourceName,
          customer_email: customerEmail || undefined,
          disclaimer_accepted: disclaimerAccepted,
        });
        setJob(created);
        setFeedback("Preview job created. The next step is checkout confirmation.");
        setError(null);
      } catch (taskError) {
        setError(getFriendlyError(taskError));
      }
    });
  }

  function handleUnlockAnalysis() {
    if (!job) return;

    runTask(async () => {
      try {
        const completed = await confirmPayment(job, text);
        setJob(completed);
        setFeedback("Payment confirmed. The structured contract preview is now unlocked.");
        setError(null);
      } catch (taskError) {
        setError(getFriendlyError(taskError));
      }
    });
  }

  function handleFollowUp() {
    if (!job || !followUpQuestion.trim()) return;

    runTask(async () => {
      try {
        const result = await askFollowUp(job, followUpQuestion.trim());
        setJob(result.job);
        setFollowUpQuestion("");
        setFeedback(
          result.response.upgrade_required
            ? "The free follow-up limit has been reached for this contract."
            : "Follow-up answer added to the conversation.",
        );
        setError(null);
      } catch (taskError) {
        setError(getFriendlyError(taskError));
      }
    });
  }

  return (
    <div className="cheka-card h-full p-6 lg:p-7" id="preview-studio">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            Interactive preview
          </p>
          <h2 className="mt-3 text-3xl text-ink">
            Upload, unlock, review, and ask follow-up questions.
          </h2>
        </div>
        <div className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-semibold text-moss">
          {demoMode ? "Demo mode" : "API connected"}
        </div>
      </div>

      <p className="mt-4 text-base leading-7 text-ink/75">
        {demoMode
          ? "This studio runs with a local preview engine so the experience still works before the FastAPI service is installed."
          : "This studio is using the configured FastAPI base URL for preview jobs, payment confirmation, and follow-up questions."}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {sampleContracts.map((sample) => (
          <button
            key={sample.id}
            className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
            onClick={() => applySample(sample.id)}
            type="button"
          >
            {sample.title}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <section className="space-y-5 rounded-[1.75rem] border border-ink/10 bg-white/75 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Contract name</span>
              <input
                className="cheka-input"
                onChange={(event) => setSourceName(event.target.value)}
                placeholder="employment-offer.pdf"
                value={sourceName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Customer email</span>
              <input
                className="cheka-input"
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="name@example.com"
                value={customerEmail}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Input type</span>
              <select
                className="cheka-input"
                onChange={(event) => setInputType(event.target.value as InputType)}
                value={inputType}
              >
                {Object.entries(inputLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Market</span>
              <select
                className="cheka-input"
                onChange={(event) => setMarket(event.target.value as Market)}
                value={market}
              >
                {Object.entries(marketLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink/70">Contract text</span>
            <textarea
              className="cheka-input min-h-[220px] resize-y"
              onChange={(event) => setText(event.target.value)}
              value={text}
            />
          </label>

          <label className="flex items-start gap-3 rounded-[1.5rem] border border-ink/10 bg-sand/70 p-4">
            <input
              checked={disclaimerAccepted}
              className="mt-1 h-4 w-4 accent-moss"
              onChange={(event) => setDisclaimerAccepted(event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm leading-6 text-ink/75">
              I understand Cheka provides guidance, not legal representation, and high-risk results should be escalated before signature.
            </span>
          </label>

          <button
            className="w-full rounded-full bg-moss px-6 py-3 text-center font-semibold text-sand transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || text.trim().length < 40}
            onClick={handleCreatePreview}
            type="button"
          >
            {isPending ? "Working..." : "Create preview job"}
          </button>
        </section>

        <section className="space-y-5">
          <div className="rounded-[1.75rem] border border-ink/10 bg-ink p-5 text-sand">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-sand/60">Job status</p>
                <h3 className="mt-2 text-2xl text-sand">
                  {job ? job.status.replaceAll("_", " ") : "waiting for intake"}
                </h3>
              </div>
              {job ? (
                <div className="rounded-full border border-sand/15 px-4 py-2 text-sm font-semibold text-coral">
                  {job.payment.payment_status === "paid" ? "Payment confirmed" : "Checkout pending"}
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-sand/80">
              <p>Source: {job?.source_name || sourceName || "Not set yet"}</p>
              <p>Market: {marketLabels[job?.market ?? market]}</p>
              <p>Payment reference: {job?.payment.payment_reference ?? "Generated after intake"}</p>
              <p>Pricing: {job?.payment.display_amount ?? "Configured at checkout"}</p>
            </div>

            {job && job.payment.payment_status === "unpaid" ? (
              <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4">
                <p className="text-sm leading-6 text-sand/80">{job.payment.note}</p>
                <button
                  className="mt-4 w-full rounded-full bg-coral px-5 py-3 font-semibold text-ink transition hover:bg-[#e38a66] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending}
                  onClick={handleUnlockAnalysis}
                  type="button"
                >
                  {isPending ? "Confirming..." : "Simulate Paystack payment"}
                </button>
              </div>
            ) : null}
          </div>

          {feedback ? <div className="rounded-[1.5rem] border border-emerald-600/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{feedback}</div> : null}
          {error ? <div className="rounded-[1.5rem] border border-rose-500/15 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

          {job?.analysis ? (
            <div className="space-y-5 rounded-[1.75rem] border border-ink/10 bg-white/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-clay">Structured result</p>
                  <h3 className="mt-2 text-2xl text-ink">{job.analysis.contract_type}</h3>
                </div>
                <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${riskStyles[job.analysis.risk_level]}`}>
                  Risk {job.analysis.risk_score} / {job.analysis.risk_level}
                </div>
              </div>

              <p className="text-base leading-7 text-ink/80">{job.analysis.summary}</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-ink/10 bg-sand/70 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Key points</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/80">
                    {job.analysis.key_points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </div>
                <div className="rounded-[1.5rem] border border-ink/10 bg-sand/70 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Recommended actions</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/80">
                    {job.analysis.recommended_actions.map((action) => <li key={action}>{action}</li>)}
                  </ul>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Financial obligations",
                    items: job.analysis.financial_obligations,
                    fallback: "No explicit payment sentence was isolated in the preview.",
                  },
                  {
                    title: "Duration terms",
                    items: job.analysis.duration_terms,
                    fallback: "No obvious duration term was isolated in the preview.",
                  },
                  {
                    title: "Cancellation terms",
                    items: job.analysis.cancellation_terms,
                    fallback: "No obvious cancellation term was isolated in the preview.",
                  },
                ].map((section) => (
                  <div key={section.title} className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{section.title}</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/80">
                      {section.items.length > 0
                        ? section.items.map((item) => <li key={item}>{item}</li>)
                        : <li>{section.fallback}</li>}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-rose-500/10 bg-rose-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-900">Red flags</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-rose-950">
                  {job.analysis.red_flags.length > 0 ? job.analysis.red_flags.map((flag) => <li key={flag}>{flag}</li>) : <li>No launch-rule red flags were isolated in the preview.</li>}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-ink/10 bg-sand/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Follow-up questions</p>
                    <p className="mt-1 text-sm text-ink/70">
                      {job.follow_up.questions_remaining} of {job.follow_up.free_limit} free questions remaining
                    </p>
                  </div>
                  {job.escalation_recommended ? <div className="rounded-full border border-rose-500/20 bg-rose-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-900">Escalation recommended</div> : null}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    className="cheka-input flex-1"
                    onChange={(event) => setFollowUpQuestion(event.target.value)}
                    placeholder="Ask about cancellation, fees, renewal, or whether it feels safe to sign."
                    value={followUpQuestion}
                  />
                  <button
                    className="rounded-full bg-ink px-5 py-3 font-semibold text-sand transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isPending || !followUpQuestion.trim()}
                    onClick={handleFollowUp}
                    type="button"
                  >
                    Ask
                  </button>
                </div>

                {job.conversation.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {job.conversation.map((message, index) => (
                      <div key={`${message.timestamp}-${index}`} className={`rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${message.role === "assistant" ? "bg-white text-ink" : "bg-ink text-sand"}`}>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{message.role}</p>
                        <p>{message.content}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
