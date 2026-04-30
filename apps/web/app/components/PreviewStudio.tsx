"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import { DropZone } from "./DropZone";
import { RiskGauge } from "./RiskGauge";
import {
  askFollowUp,
  confirmPayment,
  createFilePreviewJob,
  createPreviewJob,
  createUrlPreviewJob,
  initializeCheckout,
  retryJob,
  sampleContracts,
  usingExternalApi,
} from "../lib/preview-demo";
import type { ContractJobResponse, InputType, Market, RiskClassification } from "../lib/types";

const marketLabels: Record<Market, string> = {
  south_africa: "South Africa",
  kenya: "Kenya",
};

const inputLabels: Record<InputType, string> = {
  pdf: "PDF document",
  docx: "Word document",
  image: "Image / scan",
  url: "Public URL",
};

const riskBadgeStyles: Record<RiskClassification, string> = {
  low: "border-emerald-200/70 bg-emerald-50/80 text-emerald-800",
  medium: "border-amber-200/70 bg-amber-50/80 text-amber-800",
  high: "border-rose-200/70 bg-rose-50/80 text-rose-800",
};

const stageOrder = ["intake", "checkout", "analysis", "ask"] as const;
type Stage = (typeof stageOrder)[number];

const stageLabels: Record<Stage, string> = {
  intake: "Upload",
  checkout: "Checkout",
  analysis: "Analysis",
  ask: "Ask",
};

const starterSample = sampleContracts[0]!;

interface ApiStatus {
  openai_enabled: boolean;
  external_api: boolean;
  analysis_model?: string;
}

function getFriendlyError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while preparing the preview. Please try again.";
}

function detectInputTypeFromFile(file: File): InputType {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (type.includes("word") || name.endsWith(".docx")) return "docx";
  if (type.includes("image") || /\.(png|jpg|jpeg|webp)$/.test(name)) return "image";
  return "pdf";
}

export function PreviewStudio() {
  const [sourceName, setSourceName] = useState(starterSample.source_name);
  const [inputType, setInputType] = useState<InputType>(starterSample.input_type);
  const [market, setMarket] = useState<Market>(starterSample.market);
  const [customerEmail, setCustomerEmail] = useState("");
  const [text, setText] = useState(starterSample.text);
  const [publicUrl, setPublicUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(true);
  const [job, setJob] = useState<ContractJobResponse | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ openai_enabled: false, external_api: false });
  const conversationRef = useRef<HTMLDivElement>(null);

  const externalApi = usingExternalApi();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ApiStatus | null) => {
        if (data && !cancelled) setApiStatus(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (job?.conversation && conversationRef.current) {
      conversationRef.current.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [job?.conversation]);

  const stage: Stage = !job
    ? "intake"
    : job.analysis
      ? "ask"
      : job.payment.payment_status === "paid"
        ? "analysis"
        : "checkout";

  const canCreatePreview =
    inputType === "url"
      ? Boolean(publicUrl.trim()) || text.trim().length >= 40
      : Boolean(selectedFile) || text.trim().length >= 40;

  const engineLabel = externalApi
    ? "FastAPI"
    : apiStatus.openai_enabled
      ? `OpenAI · ${apiStatus.analysis_model ?? "gpt-4o-mini"}`
      : "Demo (rules)";

  const engineHealthy = apiStatus.openai_enabled || externalApi;

  function runTask(label: string, task: () => Promise<void>) {
    setIsPending(true);
    setPendingLabel(label);
    startTransition(() => {
      void task().finally(() => {
        setIsPending(false);
        setPendingLabel(null);
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
    setPublicUrl("");
    setSelectedFile(null);
    setCustomerEmail("");
    setDisclaimerAccepted(true);
    setJob(null);
    setFollowUpQuestion("");
    setFeedback(`Loaded "${sample.title}".`);
    setError(null);
  }

  function handleFileSelected(file: File) {
    setSelectedFile(file);
    setInputType(detectInputTypeFromFile(file));
    if (!sourceName || sourceName === starterSample.source_name) {
      setSourceName(file.name);
    }
  }

  function handleCreatePreview() {
    if (!disclaimerAccepted) {
      setError("Please accept the disclaimer to unlock analysis.");
      return;
    }

    runTask("Creating preview job", async () => {
      try {
        const created =
          inputType === "url" && publicUrl.trim() && externalApi
            ? await createUrlPreviewJob({
                url: publicUrl.trim(),
                market,
                source_name: sourceName || publicUrl.trim(),
                customer_email: customerEmail || undefined,
                disclaimer_accepted: disclaimerAccepted,
              })
            : selectedFile
              ? await createFilePreviewJob({
                  file: selectedFile,
                  market,
                  source_name: sourceName || selectedFile.name,
                  customer_email: customerEmail || undefined,
                  disclaimer_accepted: disclaimerAccepted,
                })
              : await createPreviewJob({
                  input_type: inputType,
                  market,
                  text,
                  source_name: sourceName,
                  customer_email: customerEmail || undefined,
                  disclaimer_accepted: disclaimerAccepted,
                });
        setJob(created);
        setFeedback("Preview job created. Confirm the demo checkout to unlock analysis.");
        setError(null);
      } catch (taskError) {
        setError(getFriendlyError(taskError));
      }
    });
  }

  function handlePrepareCheckout() {
    if (!job) return;
    runTask("Preparing checkout", async () => {
      try {
        const updated = await initializeCheckout(job, {
          customer_email: customerEmail || job.customer_email || undefined,
        });
        setJob(updated);
        setFeedback("Checkout prepared. Confirm payment to unlock the structured preview.");
        setError(null);
      } catch (taskError) {
        setError(getFriendlyError(taskError));
      }
    });
  }

  function handleUnlockAnalysis() {
    if (!job) return;
    runTask("Running AI analysis", async () => {
      try {
        const completed = await confirmPayment(job, {
          text,
          file: selectedFile ?? undefined,
          url: inputType === "url" ? publicUrl : undefined,
          sourceName,
          inputType,
        });
        setJob(completed);
        setFeedback(
          completed.status === "completed"
            ? "Analysis ready."
            : completed.status === "failed"
              ? "Payment was confirmed, but analysis failed. Try retrying."
              : "Payment confirmed. Analysis is processing.",
        );
        setError(null);
      } catch (taskError) {
        setError(getFriendlyError(taskError));
      }
    });
  }

  function handleFollowUp() {
    if (!job || !followUpQuestion.trim()) return;
    runTask("Asking follow-up", async () => {
      try {
        const result = await askFollowUp(job, followUpQuestion.trim());
        setJob(result.job);
        setFollowUpQuestion("");
        setFeedback(
          result.response.upgrade_required
            ? "Free follow-up limit reached. Subscription tier coming next."
            : "Answer added.",
        );
        setError(null);
      } catch (taskError) {
        setError(getFriendlyError(taskError));
      }
    });
  }

  function handleRetry() {
    if (!job) return;
    runTask("Retrying analysis", async () => {
      try {
        const retried = await retryJob(job, {
          text,
          file: selectedFile ?? undefined,
          url: inputType === "url" ? publicUrl : undefined,
          sourceName,
          inputType,
        });
        setJob(retried);
        setFeedback("Retry complete.");
        setError(null);
      } catch (taskError) {
        setError(getFriendlyError(taskError));
      }
    });
  }

  function handleStartOver() {
    setJob(null);
    setSelectedFile(null);
    setText(starterSample.text);
    setSourceName(starterSample.source_name);
    setInputType(starterSample.input_type);
    setMarket(starterSample.market);
    setPublicUrl("");
    setFollowUpQuestion("");
    setFeedback(null);
    setError(null);
  }

  return (
    <div className="glass-strong overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/40 bg-white/35 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 items-center gap-2 rounded-full border border-white/70 bg-white/65 px-2.5 text-[11px] font-medium text-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            New review
          </div>
          <p className="hidden text-sm font-medium text-ink sm:block">Contract review workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`badge ${
              engineHealthy
                ? "border-accent/30 bg-accent-soft/80 text-accent-strong"
                : "border-amber-200/70 bg-amber-50/80 text-amber-800"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${engineHealthy ? "bg-accent" : "bg-amber-500"}`}
            />
            {engineLabel}
          </span>
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs"
            onClick={handleStartOver}
            disabled={isPending}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Stage indicator (Crextio pill nav) */}
      <div className="scrollbar-none overflow-x-auto border-b border-white/40 px-3.5 py-3 sm:px-5">
        <ol className="flex min-w-max items-center gap-1.5 sm:gap-2">
          {stageOrder.map((s, index) => {
            const currentIndex = stageOrder.indexOf(stage);
            const isActive = s === stage;
            const isComplete = currentIndex > index;
            return (
              <li key={s} className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
                    isActive
                      ? "bg-ink text-white shadow-soft"
                      : isComplete
                        ? "bg-butter-soft text-butter-deep"
                        : "border border-white/70 bg-white/60 text-muted backdrop-blur"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isComplete
                          ? "bg-butter text-ink"
                          : "border border-white/70 bg-white/65 text-muted"
                    }`}
                  >
                    {isComplete ? "✓" : index + 1}
                  </span>
                  {stageLabels[s]}
                </div>
                {index < stageOrder.length - 1 ? (
                  <span className="hidden h-px w-6 bg-white/60 sm:inline-block" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      {(feedback || error) && stage === "intake" ? (
        <div className="px-3.5 pt-3 sm:px-5">
          {feedback ? (
            <div className="mx-auto max-w-3xl animate-fade-up rounded-xl border border-emerald-200/70 bg-emerald-50/85 px-3 py-2 text-xs text-emerald-900 backdrop-blur">
              {feedback}
            </div>
          ) : null}
          {error ? (
            <div className="mx-auto max-w-3xl animate-fade-up rounded-xl border border-rose-200/70 bg-rose-50/85 px-3 py-2 text-xs text-rose-900 backdrop-blur">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="p-3.5 sm:p-5">
        <section
          className={`mx-auto max-w-3xl ${stage === "intake" ? "block" : "hidden"}`}
          id="preview-form"
        >
          <div className="mb-4 rounded-xl border border-slate-200/80 bg-white/70 p-3 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Upload contract</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Start with a file, a sample contract, or pasted text. The next step confirms the review before results are shown.
                </p>
              </div>
              <span className="rounded-full border border-accent/20 bg-accent-soft/70 px-2.5 py-1 text-[11px] font-semibold text-accent-strong">
                Step 1 of 3
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sampleContracts.map((sample) => (
                <button
                  key={sample.id}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-muted shadow-soft transition hover:border-accent/40 hover:text-ink no-tap-highlight"
                  onClick={() => applySample(sample.id)}
                  type="button"
                >
                  {sample.title.split(" with ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <DropZone
              disabled={isPending}
              onClear={() => setSelectedFile(null)}
              onFile={handleFileSelected}
              selectedFile={selectedFile}
            />

            <div className="grid gap-3 rounded-xl border border-slate-200/80 bg-white/65 p-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="label">Contract name</span>
                <input
                  className="input-glass bg-white/90"
                  onChange={(event) => setSourceName(event.target.value)}
                  placeholder="employment-offer.pdf"
                  value={sourceName}
                />
              </label>
              <label className="space-y-1.5">
                <span className="label">Email (optional)</span>
                <input
                  className="input-glass bg-white/90"
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="name@example.com"
                  value={customerEmail}
                />
              </label>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200/80 bg-white/65 p-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="label">Type</span>
                <select
                  className="input-glass bg-white/90"
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
              <label className="space-y-1.5">
                <span className="label">Market</span>
                <select
                  className="input-glass bg-white/90"
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

            {inputType === "url" ? (
              <label className="space-y-1.5 rounded-xl border border-slate-200/80 bg-white/65 p-3">
                <span className="label">Public URL</span>
                <input
                  className="input-glass bg-white/90"
                  onChange={(event) => setPublicUrl(event.target.value)}
                  placeholder="https://example.com/contract"
                  value={publicUrl}
                />
              </label>
            ) : null}

            <label className="block rounded-xl border border-slate-200/80 bg-white/65 p-3">
              <span className="label">Or paste contract text</span>
              <textarea
                className="input-glass mt-1.5 min-h-[150px] resize-y bg-white/90 font-mono text-xs leading-5"
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste contract text here, or drop a file above."
                value={text}
              />
              <p className="mt-1.5 text-[11px] text-muted">{text.length.toLocaleString()} chars / 40 needed</p>
            </label>

            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white/75 p-3 backdrop-blur">
              <input
                checked={disclaimerAccepted}
                className="mt-0.5 h-4 w-4 accent-accent"
                onChange={(event) => setDisclaimerAccepted(event.target.checked)}
                type="checkbox"
              />
              <span className="text-xs leading-5 text-muted">
                Cheka provides guidance, not legal representation. High-risk contracts should be escalated for legal review before signature.
              </span>
            </label>

            <button
              className="btn-primary w-full px-4 py-2.5"
              disabled={isPending || !canCreatePreview}
              onClick={handleCreatePreview}
              type="button"
            >
              {isPending && pendingLabel === "Creating preview job" ? (
                <>
                  <Spinner /> Creating preview…
                </>
              ) : (
                <>
                  Continue to confirmation
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </section>

        <section
          className={`mx-auto ${job?.analysis ? "max-w-6xl" : "max-w-2xl"} ${
            stage === "intake" ? "hidden" : "block"
          }`}
        >
          {!job?.analysis ? (
            <JobStatusCard
              externalApi={externalApi}
              isPending={isPending}
              job={job}
              market={market}
              onConfirmPayment={handleUnlockAnalysis}
              onPrepareCheckout={handlePrepareCheckout}
              pendingLabel={pendingLabel}
              sourceName={sourceName}
            />
          ) : null}

          {feedback ? (
            <div className="mt-3 animate-fade-up rounded-2xl border border-emerald-200/70 bg-emerald-50/85 px-3 py-2 text-xs text-emerald-900 backdrop-blur">
              {feedback}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 animate-fade-up rounded-2xl border border-rose-200/70 bg-rose-50/85 px-3 py-2 text-xs text-rose-900 backdrop-blur">
              {error}
            </div>
          ) : null}

          {isPending && pendingLabel === "Running AI analysis" ? <AnalysisSkeleton /> : null}

          {job?.status === "failed" ? (
            <div className="mt-3 rounded-2xl border border-rose-200/70 bg-rose-50/85 p-3 backdrop-blur">
              <p className="text-sm text-rose-950">
                Analysis failed. Retry without creating a new checkout session.
              </p>
              <button
                className="btn-primary mt-2 w-full"
                disabled={isPending}
                onClick={handleRetry}
                type="button"
              >
                {isPending ? "Retrying…" : "Retry analysis"}
              </button>
            </div>
          ) : null}

          {job?.analysis ? (
            <AnalysisCard
              analysis={job.analysis}
              conversation={job.conversation}
              conversationRef={conversationRef}
              followUp={job.follow_up}
              followUpQuestion={followUpQuestion}
              isPending={isPending}
              onAsk={handleFollowUp}
              onChangeQuestion={setFollowUpQuestion}
              escalation={job.escalation_recommended}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

interface JobStatusCardProps {
  job: ContractJobResponse | null;
  market: Market;
  sourceName: string;
  externalApi: boolean;
  isPending: boolean;
  pendingLabel: string | null;
  onPrepareCheckout: () => void;
  onConfirmPayment: () => void;
}

function JobStatusCard({
  job,
  market,
  sourceName,
  externalApi,
  isPending,
  pendingLabel,
  onPrepareCheckout,
  onConfirmPayment,
}: JobStatusCardProps) {
  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Job status</p>
          <h3 className="mt-0.5 text-base font-semibold capitalize text-ink">
            {job ? job.status.replace(/_/g, " ") : "Waiting for upload"}
          </h3>
        </div>
        {job ? (
          <span
            className={`badge ${
              job.payment.payment_status === "paid"
                ? "border-emerald-200/70 bg-emerald-50/85 text-emerald-700"
                : "border-amber-200/70 bg-amber-50/85 text-amber-800"
            }`}
          >
            {job.payment.payment_status === "paid" ? "Paid" : "Checkout pending"}
          </span>
        ) : (
          <span className="badge border-white/70 bg-white/60 text-muted">Idle</span>
        )}
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted">Source</dt>
          <dd className="truncate font-medium text-ink">{job?.source_name || sourceName || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Market</dt>
          <dd className="font-medium text-ink">{marketLabels[job?.market ?? market]}</dd>
        </div>
        <div className="truncate">
          <dt className="text-muted">Reference</dt>
          <dd className="truncate font-mono text-[11px] text-ink">{job?.payment.payment_reference ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Pricing</dt>
          <dd className="font-medium text-ink">{job?.payment.display_amount ?? "Set at checkout"}</dd>
        </div>
      </dl>

      {job && job.payment.payment_status === "unpaid" ? (
        <div className="mt-3 space-y-2 border-t border-white/40 pt-3">
          <p className="text-xs leading-5 text-muted">{job.payment.note}</p>
          {externalApi ? (
            <button
              className="btn-glass w-full"
              disabled={isPending}
              onClick={onPrepareCheckout}
              type="button"
            >
              {isPending && pendingLabel === "Preparing checkout" ? "Preparing…" : "Prepare checkout"}
            </button>
          ) : null}
          {externalApi && job.payment.checkout_url ? (
            <a
              className="btn-glass w-full"
              href={job.payment.checkout_url}
              rel="noreferrer"
              target="_blank"
            >
              Open checkout ↗
            </a>
          ) : null}
          <button
            className="btn-accent w-full"
            disabled={isPending}
            onClick={onConfirmPayment}
            type="button"
          >
            {isPending && pendingLabel === "Running AI analysis" ? (
              <>
                <Spinner /> Running analysis…
              </>
            ) : externalApi ? (
              "Confirm payment after checkout"
            ) : (
              "Simulate payment & unlock analysis"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="mt-3 glass p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/60" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 animate-pulse rounded-full bg-white/60" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-white/60" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded-full bg-white/60" />
        <div className="h-3 w-[92%] animate-pulse rounded-full bg-white/60" />
        <div className="h-3 w-[80%] animate-pulse rounded-full bg-white/60" />
      </div>
      <p className="mt-3 text-[11px] text-muted">Reading the contract and scoring the risk…</p>
    </div>
  );
}

interface AnalysisCardProps {
  analysis: NonNullable<ContractJobResponse["analysis"]>;
  conversation: ContractJobResponse["conversation"];
  conversationRef: React.RefObject<HTMLDivElement | null>;
  followUp: ContractJobResponse["follow_up"];
  followUpQuestion: string;
  onAsk: () => void;
  onChangeQuestion: (value: string) => void;
  isPending: boolean;
  escalation: boolean;
}

function AnalysisCard({
  analysis,
  conversation,
  conversationRef,
  followUp,
  followUpQuestion,
  onAsk,
  onChangeQuestion,
  isPending,
  escalation,
}: AnalysisCardProps) {
  return (
    <div className="mt-3 space-y-4 glass-strong p-4 animate-fade-up sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <RiskGauge score={analysis.risk_score} level={analysis.risk_level} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="badge border-white/70 bg-white/65 text-muted backdrop-blur">{analysis.contract_type}</p>
          <p className="text-sm leading-6 text-ink">{analysis.summary}</p>
          {escalation ? (
            <p className="badge border-rose-200/70 bg-rose-50/85 text-rose-800">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse-dot" />
              Escalation recommended
            </p>
          ) : null}
        </div>
      </div>

      {analysis.factors.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Risk factors</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {analysis.factors.map((factor) => (
              <div
                key={factor.key}
                className="rounded-2xl border border-white/70 bg-white/55 p-3 text-xs backdrop-blur transition hover:bg-white/75"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{factor.label}</p>
                  <span
                    className={`badge ${
                      riskBadgeStyles[factor.weight >= 17 ? "high" : factor.weight >= 12 ? "medium" : "low"]
                    }`}
                  >
                    +{factor.weight}
                  </span>
                </div>
                <p className="mt-1 leading-5 text-muted">{factor.explanation}</p>
                {factor.evidence ? (
                  <p className="mt-1.5 rounded-xl border border-white/70 bg-white/45 px-2 py-1 font-mono text-[10px] leading-4 text-slate-700 backdrop-blur">
                    “{factor.evidence}”
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <DetailList title="Key points" items={analysis.key_points} />
        <DetailList title="Recommended actions" items={analysis.recommended_actions} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <DetailList
          title="Financial obligations"
          items={analysis.financial_obligations}
          fallback="No explicit payment sentence isolated."
          compact
        />
        <DetailList
          title="Duration terms"
          items={analysis.duration_terms}
          fallback="No obvious duration term isolated."
          compact
        />
        <DetailList
          title="Cancellation terms"
          items={analysis.cancellation_terms}
          fallback="No obvious cancellation term isolated."
          compact
        />
      </div>

      {analysis.red_flags.length > 0 ? (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/85 p-3 backdrop-blur sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-900">Red flags</p>
          <ul className="mt-1.5 space-y-1.5 text-xs leading-5 text-rose-950">
            {analysis.red_flags.map((flag) => (
              <li key={flag} className="flex gap-2">
                <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/70 bg-white/55 p-3 backdrop-blur sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Follow-up chat</p>
            <p className="text-[11px] text-muted">
              {followUp.questions_remaining} of {followUp.free_limit} free questions remaining
            </p>
          </div>
          <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-white/65">
            <div
              className="h-full bg-butter transition-all"
              style={{ width: `${(followUp.questions_remaining / followUp.free_limit) * 100}%` }}
            />
          </div>
        </div>

        {conversation.length > 0 ? (
          <div ref={conversationRef} className="scrollbar-thin mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {conversation.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                    message.role === "assistant"
                      ? "border border-white/70 bg-white/85 text-ink backdrop-blur"
                      : "bg-ink text-white shadow-soft"
                  }`}
                >
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                    {message.role === "assistant" ? "Cheka" : "You"}
                  </p>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {[
              "Is it safe to sign?",
              "What does cancellation cost?",
              "Are there hidden fees?",
              "What happens at renewal?",
            ].map((sample) => (
              <button
                key={sample}
                className="rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-left text-xs text-muted backdrop-blur transition hover:bg-white/85 hover:text-ink no-tap-highlight"
                onClick={() => onChangeQuestion(sample)}
                type="button"
              >
                {sample}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="input-glass flex-1"
            onChange={(event) => onChangeQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && followUpQuestion.trim()) onAsk();
            }}
            placeholder="Ask about cancellation, fees, renewal, or whether it feels safe to sign."
            value={followUpQuestion}
            disabled={followUp.questions_remaining === 0}
          />
          <button
            className="btn-primary px-4"
            disabled={isPending || !followUpQuestion.trim() || followUp.questions_remaining === 0}
            onClick={onAsk}
            type="button"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

interface DetailListProps {
  title: string;
  items: string[];
  fallback?: string;
  compact?: boolean;
}

function DetailList({ title, items, fallback, compact }: DetailListProps) {
  const displayItems = items.length > 0 ? items : fallback ? [fallback] : [];
  return (
    <div className="rounded-2xl border border-white/70 bg-white/55 p-3 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{title}</p>
      <ul
        className={`mt-1.5 space-y-1.5 ${compact ? "text-[11px] leading-4" : "text-xs leading-5"} text-slate-800`}
      >
        {displayItems.length === 0 ? (
          <li className="text-muted">No data captured.</li>
        ) : (
          displayItems.map((item) => (
            <li key={item} className="flex gap-1.5">
              <span aria-hidden className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              <span>{item}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
