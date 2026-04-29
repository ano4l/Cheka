"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";

import {
  confirmAdminPayment,
  getAdminJob,
  getAdminJobMetrics,
  listAdminJobs,
  retryAdminJob,
  usingAdminStudio,
} from "../lib/admin-api";
import type {
  ContractJobResponse,
  JobMetricsResponse,
  JobStatus,
  Market,
  PaymentStatus,
  RiskClassification,
} from "../lib/types";

type AdminStatusFilter = "all" | JobStatus;
type AdminPaymentFilter = "all" | PaymentStatus;
type AdminMarketFilter = "all" | Market;

const statusOptions: Array<{ value: AdminStatusFilter; label: string }> = [
  { value: "all", label: "All jobs" },
  { value: "pending", label: "Pending" },
  { value: "payment_pending", label: "Payment pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const paymentOptions: Array<{ value: AdminPaymentFilter; label: string }> = [
  { value: "all", label: "All payments" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

const marketOptions: Array<{ value: AdminMarketFilter; label: string }> = [
  { value: "all", label: "All markets" },
  { value: "south_africa", label: "South Africa" },
  { value: "kenya", label: "Kenya" },
];

const riskStyles: Record<RiskClassification, string> = {
  low: "border-emerald-600/20 bg-emerald-50 text-emerald-800",
  medium: "border-amber-500/20 bg-amber-50 text-amber-800",
  high: "border-rose-500/20 bg-rose-50 text-rose-800",
};

const statusStyles: Record<JobStatus, string> = {
  pending: "border-ink/10 bg-white/70 text-ink",
  payment_pending: "border-amber-500/20 bg-amber-50 text-amber-800",
  processing: "border-sky-500/20 bg-sky-50 text-sky-800",
  completed: "border-emerald-600/20 bg-emerald-50 text-emerald-800",
  failed: "border-rose-500/20 bg-rose-50 text-rose-800",
};

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getFriendlyError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong while loading the admin job view.";
}

function sortJobs(jobs: ContractJobResponse[]) {
  return [...jobs].sort((left, right) => {
    const leftTime = Date.parse(left.updated_at || left.created_at);
    const rightTime = Date.parse(right.updated_at || right.created_at);
    return rightTime - leftTime;
  });
}

function upsertJob(jobs: ContractJobResponse[], job: ContractJobResponse) {
  const existing = jobs.some((entry) => entry.job_id === job.job_id);
  return sortJobs(
    existing
      ? jobs.map((entry) => (entry.job_id === job.job_id ? job : entry))
      : [job, ...jobs],
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFormatter.format(date);
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function jobNeedsAttention(job: ContractJobResponse) {
  if (job.status === "failed") {
    return true;
  }

  if (job.payment.payment_status === "unpaid") {
    return job.status === "pending" || job.status === "payment_pending";
  }

  return job.status !== "completed";
}

function shareOf(total: number, value: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function MetricRow(props: {
  label: string;
  value: number;
  total: number;
  toneClass: string;
}) {
  const percentage = shareOf(props.total, props.value);
  const width = props.value > 0 ? Math.max(percentage, 8) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-ink/75">{props.label}</span>
        <span className="font-semibold text-ink">
          {props.value}
          {props.total > 0 ? ` (${percentage}%)` : ""}
        </span>
      </div>
      <div className="h-2 rounded-full bg-sand/80">
        <div
          className={`h-full rounded-full ${props.toneClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function AdminJobsStudio() {
  const studioEnabled = usingAdminStudio();
  const [jobs, setJobs] = useState<ContractJobResponse[]>([]);
  const [metrics, setMetrics] = useState<JobMetricsResponse | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<AdminPaymentFilter>("all");
  const [marketFilter, setMarketFilter] = useState<AdminMarketFilter>("all");
  const [limit, setLimit] = useState(40);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isRefreshingJob, setIsRefreshingJob] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isRetryingJob, setIsRetryingJob] = useState(false);
  const serverFilters = {
    status: statusFilter === "all" ? undefined : statusFilter,
    paymentStatus: paymentFilter === "all" ? undefined : paymentFilter,
    market: marketFilter === "all" ? undefined : marketFilter,
  };

  const selectedJob = jobs.find((job) => job.job_id === selectedJobId) ?? null;
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const visibleJobs = jobs.filter((job) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const haystack = [
      job.job_id,
      job.source_name ?? "",
      job.customer_email ?? "",
      job.payment.payment_reference,
      job.status,
      job.market,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearchQuery);
  });
  const attentionCount = visibleJobs.filter(jobNeedsAttention).length;
  const loadedScopeLabel = metrics
    ? `${jobs.length} loaded in the browser panel from ${metrics.total_jobs} jobs matching the current server filters`
    : `${jobs.length} loaded from the current server filters`;
  const canConfirmPayment = Boolean(
    selectedJob
      && selectedJob.payment.payment_status === "unpaid"
      && (selectedJob.status === "pending" || selectedJob.status === "payment_pending"),
  );

  function applyFocus(filters: {
    status: AdminStatusFilter;
    payment: AdminPaymentFilter;
    market?: AdminMarketFilter;
  }) {
    setStatusFilter(filters.status);
    setPaymentFilter(filters.payment);
    setMarketFilter(filters.market ?? "all");
  }

  function loadJobs(options: { preserveSelection: boolean }) {
    if (!studioEnabled) {
      return;
    }

    setIsLoadingList(true);
    startTransition(() => {
      void Promise.all([
        listAdminJobs({
          ...serverFilters,
          limit,
        }),
        getAdminJobMetrics(serverFilters),
      ])
        .then(([fetchedJobs, fetchedMetrics]) => {
          const nextJobs = sortJobs(fetchedJobs);
          setJobs(nextJobs);
          setMetrics(fetchedMetrics);
          setSelectedJobId((current) => {
            if (options.preserveSelection && current && nextJobs.some((job) => job.job_id === current)) {
              return current;
            }
            return nextJobs[0]?.job_id ?? null;
          });
          setFeedback(
            nextJobs.length > 0
              ? `Loaded ${nextJobs.length} jobs from the internal operations feed.`
              : "No jobs matched the current admin filters.",
          );
          setError(null);
        })
        .catch((taskError) => {
          setError(getFriendlyError(taskError));
        })
        .finally(() => {
          setIsLoadingList(false);
        });
    });
  }

  function refreshMetrics() {
    if (!studioEnabled) {
      return;
    }

    startTransition(() => {
      void getAdminJobMetrics(serverFilters)
        .then((nextMetrics) => {
          setMetrics(nextMetrics);
          setError(null);
        })
        .catch((taskError) => {
          setError(getFriendlyError(taskError));
        });
    });
  }

  function refreshSelectedJob(jobId: string) {
    if (!studioEnabled) {
      return;
    }

    setIsRefreshingJob(true);
    startTransition(() => {
      void getAdminJob(jobId)
        .then((job) => {
          setJobs((currentJobs) => upsertJob(currentJobs, job));
          refreshMetrics();
          setError(null);
        })
        .catch((taskError) => {
          setError(getFriendlyError(taskError));
        })
        .finally(() => {
          setIsRefreshingJob(false);
        });
    });
  }

  function handleConfirmPayment() {
    if (!selectedJob) {
      return;
    }

    setIsConfirmingPayment(true);
    startTransition(() => {
      void confirmAdminPayment(selectedJob.job_id, selectedJob.payment.payment_reference)
        .then((job) => {
          setJobs((currentJobs) => upsertJob(currentJobs, job));
          setSelectedJobId(job.job_id);
          refreshMetrics();
          setFeedback(
            job.status === "completed"
              ? "Payment was confirmed and the job completed successfully."
              : job.status === "failed"
                ? "Payment was confirmed, but processing failed. Check backend logs and retry if needed."
                : "Payment was confirmed and the job is now processing.",
          );
          setError(null);
        })
        .catch((taskError) => {
          setError(getFriendlyError(taskError));
        })
        .finally(() => {
          setIsConfirmingPayment(false);
        });
    });
  }

  function handleRetry() {
    if (!selectedJob) {
      return;
    }

    setIsRetryingJob(true);
    startTransition(() => {
      void retryAdminJob(selectedJob.job_id)
        .then((job) => {
          setJobs((currentJobs) => upsertJob(currentJobs, job));
          setSelectedJobId(job.job_id);
          refreshMetrics();
          setFeedback(
            job.status === "completed"
              ? "Retry completed successfully and the structured result is available again."
              : job.status === "failed"
                ? "Retry ran but the job is still failing. Check the backend logs before retrying again."
                : "Retry accepted. The job is back in processing.",
          );
          setError(null);
        })
        .catch((taskError) => {
          setError(getFriendlyError(taskError));
        })
        .finally(() => {
          setIsRetryingJob(false);
        });
    });
  }

  useEffect(() => {
    if (!studioEnabled) {
      return;
    }

    const requestFilters = {
      status: statusFilter === "all" ? undefined : statusFilter,
      paymentStatus: paymentFilter === "all" ? undefined : paymentFilter,
      market: marketFilter === "all" ? undefined : marketFilter,
    };
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      setIsLoadingList(true);
      startTransition(() => {
        void Promise.all([
          listAdminJobs({
            ...requestFilters,
            limit,
          }),
          getAdminJobMetrics(requestFilters),
        ])
          .then(([fetchedJobs, fetchedMetrics]) => {
            if (cancelled) {
              return;
            }

            const nextJobs = sortJobs(fetchedJobs);
            setJobs(nextJobs);
            setMetrics(fetchedMetrics);
            setSelectedJobId((current) => {
              if (current && nextJobs.some((job) => job.job_id === current)) {
                return current;
              }
              return nextJobs[0]?.job_id ?? null;
            });
            setFeedback(
              nextJobs.length > 0
                ? `Loaded ${nextJobs.length} jobs from the internal operations feed.`
                : "No jobs matched the current admin filters.",
            );
            setError(null);
          })
          .catch((taskError) => {
            if (cancelled) {
              return;
            }

            setError(getFriendlyError(taskError));
          })
          .finally(() => {
            if (!cancelled) {
              setIsLoadingList(false);
            }
          });
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [studioEnabled, statusFilter, paymentFilter, marketFilter, limit]);

  useEffect(() => {
    if (!studioEnabled || !selectedJobId) {
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      setIsRefreshingJob(true);
      startTransition(() => {
        void getAdminJob(selectedJobId)
          .then((job) => {
            if (cancelled) {
              return;
            }

            setJobs((currentJobs) => upsertJob(currentJobs, job));
            setError(null);
          })
          .catch((taskError) => {
            if (cancelled) {
              return;
            }

            setError(getFriendlyError(taskError));
          })
          .finally(() => {
            if (!cancelled) {
              setIsRefreshingJob(false);
            }
          });
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [studioEnabled, selectedJobId]);

  if (!studioEnabled) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">
              Internal operations
            </p>
            <h1 className="mt-3 text-4xl text-ink">Admin jobs studio</h1>
          </div>
          <div className="rounded-full border border-amber-500/20 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
            Disabled
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-ink/10 bg-white/75 p-5 text-base leading-7 text-ink/80">
          <p>
            This route is intentionally gated because the current jobs list endpoint is internal and unscoped.
          </p>
          <p className="mt-4">
            To enable the prototype admin view locally, set both <code>NEXT_PUBLIC_CHEKA_API_URL</code> and <code>NEXT_PUBLIC_ENABLE_ADMIN_STUDIO=true</code> in <code>apps/web/.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            Internal operations
          </p>
          <h1 className="mt-3 text-4xl text-ink">Admin jobs studio</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/75">
            Filter jobs, inspect details, confirm stuck payments, and retry failed paid jobs from one internal view.
          </p>
        </div>
        <div className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-semibold text-moss">
          Internal only
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-amber-500/15 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        The current jobs feed is intentionally treated as an internal tool because the API list endpoint is not user-scoped yet.
      </div>

      {feedback ? (
        <div className="rounded-[1.5rem] border border-emerald-600/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[1.5rem] border border-rose-500/15 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Jobs in scope",
            value: metrics?.total_jobs ?? jobs.length,
            detail: loadedScopeLabel,
          },
          {
            label: "Attention queue",
            value: metrics?.attention_jobs ?? attentionCount,
            detail: "Failed, unpaid, or still in-flight after payment",
          },
          {
            label: "Payment queue",
            value: metrics?.payment_queue_jobs ?? 0,
            detail: "Unpaid jobs still waiting for payment confirmation",
          },
          {
            label: "Retry queue",
            value: metrics?.retry_queue_jobs ?? 0,
            detail: "Paid jobs that failed and can be retried",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[1.5rem] border border-ink/10 bg-white/75 p-4"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
              {card.label}
            </p>
            <p className="mt-3 text-3xl text-ink">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-ink/70">{card.detail}</p>
          </div>
        ))}
      </div>

      {metrics ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[1.5rem] border border-ink/10 bg-white/75 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
              Lifecycle mix
            </p>
            <div className="mt-4 space-y-4">
              <MetricRow label="Pending" toneClass="bg-ink" total={metrics.total_jobs} value={metrics.statuses.pending} />
              <MetricRow label="Payment pending" toneClass="bg-amber-500" total={metrics.total_jobs} value={metrics.statuses.payment_pending} />
              <MetricRow label="Processing" toneClass="bg-sky-500" total={metrics.total_jobs} value={metrics.statuses.processing} />
              <MetricRow label="Completed" toneClass="bg-emerald-600" total={metrics.total_jobs} value={metrics.statuses.completed} />
              <MetricRow label="Failed" toneClass="bg-rose-500" total={metrics.total_jobs} value={metrics.statuses.failed} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-ink/10 bg-white/75 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
              Payments and queues
            </p>
            <div className="mt-4 space-y-4">
              <MetricRow label="Paid" toneClass="bg-moss" total={metrics.total_jobs} value={metrics.payments.paid} />
              <MetricRow label="Unpaid" toneClass="bg-coral" total={metrics.total_jobs} value={metrics.payments.unpaid} />
              <MetricRow label="Needs payment" toneClass="bg-amber-500" total={metrics.total_jobs} value={metrics.payment_queue_jobs} />
              <MetricRow label="Needs retry" toneClass="bg-rose-500" total={metrics.total_jobs} value={metrics.retry_queue_jobs} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-ink/10 bg-white/75 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
              Review mix
            </p>
            <div className="mt-4 space-y-4">
              <MetricRow label="South Africa" toneClass="bg-moss" total={metrics.total_jobs} value={metrics.markets.south_africa} />
              <MetricRow label="Kenya" toneClass="bg-coral" total={metrics.total_jobs} value={metrics.markets.kenya} />
            </div>
            <div className="mt-6 border-t border-ink/8 pt-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
                Completed risk mix
              </p>
              <div className="mt-4 space-y-4">
                <MetricRow label="Low risk" toneClass="bg-emerald-600" total={metrics.analysis_ready_jobs} value={metrics.risks.low} />
                <MetricRow label="Medium risk" toneClass="bg-amber-500" total={metrics.analysis_ready_jobs} value={metrics.risks.medium} />
                <MetricRow label="High risk" toneClass="bg-rose-500" total={metrics.analysis_ready_jobs} value={metrics.risks.high} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="space-y-5 rounded-[1.75rem] border border-ink/10 bg-white/75 p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Search jobs</span>
              <input
                className="input"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by source, email, job id, or payment reference"
                value={searchQuery}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Status filter</span>
              <select
                className="input"
                onChange={(event) => setStatusFilter(event.target.value as AdminStatusFilter)}
                value={statusFilter}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Payment filter</span>
              <select
                className="input"
                onChange={(event) => setPaymentFilter(event.target.value as AdminPaymentFilter)}
                value={paymentFilter}
              >
                {paymentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Market</span>
              <select
                className="input"
                onChange={(event) => setMarketFilter(event.target.value as AdminMarketFilter)}
                value={marketFilter}
              >
                {marketOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink/70">Limit</span>
              <select
                className="input"
                onChange={(event) => setLimit(Number(event.target.value))}
                value={String(limit)}
              >
                {[20, 40, 80].map((value) => (
                  <option key={value} value={value}>
                    {value} jobs
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              {
                label: "All jobs",
                onClick: () => applyFocus({ status: "all", payment: "all", market: "all" }),
              },
              {
                label: "Needs payment",
                onClick: () => applyFocus({ status: "all", payment: "unpaid", market: "all" }),
              },
              {
                label: "Processing",
                onClick: () => applyFocus({ status: "processing", payment: "paid", market: marketFilter }),
              },
              {
                label: "Retry queue",
                onClick: () => applyFocus({ status: "failed", payment: "paid", market: marketFilter }),
              },
            ].map((focus) => (
              <button
                key={focus.label}
                className="rounded-full border border-ink/12 bg-sand/70 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
                onClick={focus.onClick}
                type="button"
              >
                {focus.label}
              </button>
            ))}
          </div>

          <button
            className="rounded-full border border-ink/15 bg-white/70 px-5 py-3 font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoadingList}
            onClick={() => loadJobs({ preserveSelection: true })}
            type="button"
          >
            {isLoadingList ? "Refreshing list..." : "Refresh jobs list"}
          </button>

          <div className="rounded-[1.5rem] border border-ink/10 bg-sand/60 p-3 text-sm text-ink/70">
            Search is applied to the loaded list only. Showing {visibleJobs.length} matches from {jobs.length} loaded jobs.
          </div>

          <div className="space-y-3">
            {visibleJobs.length > 0 ? (
              visibleJobs.map((job) => {
                const isActive = job.job_id === selectedJobId;
                return (
                  <button
                    key={job.job_id}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition ${isActive ? "border-moss bg-moss/8" : "border-ink/10 bg-white/75 hover:bg-white"}`}
                    onClick={() => setSelectedJobId(job.job_id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {job.source_name ?? "Unnamed contract"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-clay">
                          {job.job_id}
                        </p>
                      </div>
                      <div className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${statusStyles[job.status]}`}>
                        {formatLabel(job.status)}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-ink/75 sm:grid-cols-2">
                      <p>Market: {formatLabel(job.market)}</p>
                      <p>Payment: {formatLabel(job.payment.payment_status)}</p>
                      <p>Email: {job.customer_email ?? "Not provided"}</p>
                      <p>Updated: {formatDate(job.updated_at)}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {jobNeedsAttention(job) ? (
                        <div className="rounded-full border border-amber-500/20 bg-amber-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900">
                          Attention required
                        </div>
                      ) : null}
                      {job.escalation_recommended ? (
                        <div className="rounded-full border border-rose-500/15 bg-rose-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-900">
                          Escalate
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white/50 p-5 text-sm leading-6 text-ink/70">
                {isLoadingList
                  ? "Loading jobs from the admin feed..."
                  : "No jobs match the current filters or search query."}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5 rounded-[1.75rem] border border-ink/10 bg-white/75 p-5">
          {selectedJob ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
                    Job detail
                  </p>
                  <h2 className="mt-3 text-3xl text-ink">
                    {selectedJob.source_name ?? "Unnamed contract"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ink/70">
                    {selectedJob.job_id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusStyles[selectedJob.status]}`}>
                    {formatLabel(selectedJob.status)}
                  </div>
                  {selectedJob.analysis ? (
                    <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${riskStyles[selectedJob.analysis.risk_level]}`}>
                      Risk {selectedJob.analysis.risk_score} / {formatLabel(selectedJob.analysis.risk_level)}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-ink/15 bg-white/70 px-5 py-3 font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isRefreshingJob}
                  onClick={() => refreshSelectedJob(selectedJob.job_id)}
                  type="button"
                >
                  {isRefreshingJob ? "Refreshing..." : "Refresh detail"}
                </button>
                {selectedJob.payment.checkout_url ? (
                  <a
                    className="rounded-full border border-coral/30 bg-coral/10 px-5 py-3 font-semibold text-coral transition hover:bg-coral/20"
                    href={selectedJob.payment.checkout_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open checkout
                  </a>
                ) : null}
                {canConfirmPayment ? (
                  <button
                    className="rounded-full border border-amber-500/20 bg-amber-50 px-5 py-3 font-semibold text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isConfirmingPayment}
                    onClick={handleConfirmPayment}
                    type="button"
                  >
                    {isConfirmingPayment ? "Confirming payment..." : "Mark payment confirmed"}
                  </button>
                ) : null}
                {selectedJob.status === "failed" && selectedJob.payment.payment_status === "paid" ? (
                  <button
                    className="rounded-full bg-moss px-5 py-3 font-semibold text-sand transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isRetryingJob}
                    onClick={handleRetry}
                    type="button"
                  >
                    {isRetryingJob ? "Retrying..." : "Retry failed job"}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-ink/10 bg-sand/60 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Lifecycle</p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-ink/80">
                    <p>Created: {formatDate(selectedJob.created_at)}</p>
                    <p>Updated: {formatDate(selectedJob.updated_at)}</p>
                    <p>Input type: {formatLabel(selectedJob.input_type)}</p>
                    <p>Market: {formatLabel(selectedJob.market)}</p>
                    <p>Disclaimer accepted: {selectedJob.disclaimer_accepted ? "Yes" : "No"}</p>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-ink/10 bg-sand/60 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Payment</p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-ink/80">
                    <p>Status: {formatLabel(selectedJob.payment.payment_status)}</p>
                    <p>Provider: {selectedJob.payment.provider}</p>
                    <p>Reference: {selectedJob.payment.payment_reference}</p>
                    <p>Amount label: {selectedJob.payment.display_amount}</p>
                    <p>Email: {selectedJob.customer_email ?? "Not provided"}</p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink/70">{selectedJob.payment.note}</p>
                </div>
              </div>

              {canConfirmPayment ? (
                <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  This job is still unpaid in Cheka. Use manual payment confirmation only after verifying the payment outside the app flow or when you are running local demo checkout.
                </div>
              ) : null}

              {selectedJob.analysis ? (
                <>
                  <div className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Summary</p>
                    <p className="mt-3 text-base leading-7 text-ink/80">
                      {selectedJob.analysis.summary}
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Key points</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/80">
                        {selectedJob.analysis.key_points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Recommended actions</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/80">
                        {selectedJob.analysis.recommended_actions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-[1.5rem] border border-rose-500/10 bg-rose-50 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-900">Red flags</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-rose-950">
                        {selectedJob.analysis.red_flags.length > 0
                          ? selectedJob.analysis.red_flags.map((flag) => <li key={flag}>{flag}</li>)
                          : <li>No launch-rule red flags were isolated in the preview.</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    {[
                      {
                        title: "Financial obligations",
                        items: selectedJob.analysis.financial_obligations,
                        fallback: "No explicit payment obligation was isolated in this run.",
                      },
                      {
                        title: "Duration terms",
                        items: selectedJob.analysis.duration_terms,
                        fallback: "No clear duration clause was isolated in this run.",
                      },
                      {
                        title: "Cancellation terms",
                        items: selectedJob.analysis.cancellation_terms,
                        fallback: "No clear cancellation clause was isolated in this run.",
                      },
                    ].map((section) => (
                      <div key={section.title} className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
                          {section.title}
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/80">
                          {section.items.length > 0
                            ? section.items.map((item) => <li key={item}>{item}</li>)
                            : <li>{section.fallback}</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white/60 p-4 text-sm leading-6 text-ink/70">
                  {selectedJob.status === "processing"
                    ? "This job is still processing. Refresh detail to check whether the result has landed."
                    : selectedJob.status === "failed"
                      ? "This job failed before analysis completed. Retry is available for paid failures."
                      : "Analysis has not been generated yet for this job."}
                </div>
              )}

              <div className="rounded-[1.5rem] border border-ink/10 bg-sand/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Follow-up usage</p>
                  <div className="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/75">
                    {selectedJob.follow_up.questions_used} used / {selectedJob.follow_up.free_limit} free
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink/80">
                  Questions remaining: {selectedJob.follow_up.questions_remaining}
                </p>

                {selectedJob.conversation.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {selectedJob.conversation.map((message, index) => (
                      <div
                        key={`${message.timestamp}-${index}`}
                        className={`rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${message.role === "assistant" ? "bg-white text-ink" : "bg-ink text-sand"}`}
                      >
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                          {message.role}
                        </p>
                        <p>{message.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ink/70">No follow-up conversation has been stored for this job yet.</p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white/60 p-6 text-sm leading-7 text-ink/70">
              Select a job from the left to inspect its lifecycle, payment state, and structured result.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
