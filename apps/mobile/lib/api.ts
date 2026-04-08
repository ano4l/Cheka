import {
  askDemoFollowUp,
  confirmDemoPayment,
  createDemoJob,
} from "./demo-engine";
import type {
  ContractJobResponse,
  FollowUpResponse,
  PreviewIntakeRequest,
} from "./types";

const API_BASE_URL = process.env.EXPO_PUBLIC_CHEKA_API_URL?.replace(/\/$/, "") ?? "";

export function usingExternalApi(): boolean {
  return Boolean(API_BASE_URL);
}

export async function createPreviewJob(
  payload: PreviewIntakeRequest,
): Promise<ContractJobResponse> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/v1/jobs/preview-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as ContractJobResponse;
  }
  return createDemoJob(payload);
}

export async function confirmPayment(
  job: ContractJobResponse,
  text: string,
): Promise<ContractJobResponse> {
  if (API_BASE_URL) {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/jobs/${job.job_id}/confirm-payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_reference: job.payment.payment_reference,
        }),
      },
    );
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as ContractJobResponse;
  }
  return confirmDemoPayment(job, text);
}

export async function askFollowUp(
  job: ContractJobResponse,
  question: string,
): Promise<{ job: ContractJobResponse; response: FollowUpResponse }> {
  if (API_BASE_URL) {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/jobs/${job.job_id}/follow-up`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      },
    );
    if (!res.ok) throw new Error(await res.text());
    const payload = (await res.json()) as FollowUpResponse;
    return {
      response: payload,
      job: {
        ...job,
        conversation: payload.conversation,
        follow_up: payload.follow_up,
        updated_at: new Date().toISOString(),
      },
    };
  }
  return askDemoFollowUp(job, question);
}

export async function fetchJob(jobId: string): Promise<ContractJobResponse> {
  if (!API_BASE_URL) throw new Error("Cannot fetch jobs in demo mode.");
  const res = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ContractJobResponse;
}
