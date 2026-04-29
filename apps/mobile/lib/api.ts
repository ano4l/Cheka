import {
  askDemoFollowUp,
  confirmDemoPayment,
  createDemoJob,
  retryDemoJob,
} from "./demo-engine";
import type {
  CheckoutSessionRequest,
  ContractJobResponse,
  FollowUpResponse,
  PreviewIntakeRequest,
  UrlIntakeRequest,
} from "./types";

const API_BASE_URL = process.env.EXPO_PUBLIC_CHEKA_API_URL?.replace(/\/$/, "") ?? "";

export function usingExternalApi(): boolean {
  return Boolean(API_BASE_URL);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJobCompletion(jobId: string, attempts = 12, delayMs = 1000): Promise<ContractJobResponse | null> {
  if (!API_BASE_URL) {
    return null;
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await sleep(delayMs);
    const res = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`);
    if (!res.ok) throw new Error(await res.text());
    const job = (await res.json()) as ContractJobResponse;
    if (job.status === "completed" || job.status === "failed") {
      return job;
    }
  }

  return null;
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

export async function createUrlPreviewJob(
  payload: UrlIntakeRequest,
): Promise<ContractJobResponse> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/v1/jobs/intake-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as ContractJobResponse;
  }
  throw new Error("URL intake is only available when the API is connected.");
}

export async function createFilePreviewJob(args: {
  asset: {
    uri: string;
    name: string;
    mimeType?: string | null;
  };
  market: PreviewIntakeRequest["market"];
  customer_email?: string;
  disclaimer_accepted: boolean;
  source_name?: string;
}): Promise<ContractJobResponse> {
  if (!API_BASE_URL) {
    throw new Error("File upload is only available when the API is connected.");
  }

  const formData = new FormData();
  formData.append("market", args.market);
  formData.append("disclaimer_accepted", String(args.disclaimer_accepted));
  if (args.customer_email) formData.append("customer_email", args.customer_email);
  formData.append("source_name", args.source_name ?? args.asset.name);
  formData.append("file", {
    uri: args.asset.uri,
    name: args.asset.name,
    type: args.asset.mimeType ?? "application/octet-stream",
  } as any);

  const res = await fetch(`${API_BASE_URL}/api/v1/jobs/intake-file`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ContractJobResponse;
}

export async function initializeCheckout(
  job: ContractJobResponse,
  payload: CheckoutSessionRequest = {},
): Promise<ContractJobResponse> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/v1/jobs/${job.job_id}/checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as ContractJobResponse;
  }

  return {
    ...job,
    status: "payment_pending",
    customer_email: payload.customer_email ?? job.customer_email,
    payment: {
      ...job.payment,
      note: "Demo mode uses a placeholder checkout URL before payment is simulated.",
    },
    updated_at: new Date().toISOString(),
  };
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
    const confirmed = (await res.json()) as ContractJobResponse;
    if (confirmed.status !== "processing") {
      return confirmed;
    }

    return (await waitForJobCompletion(job.job_id)) ?? confirmed;
  }
  return confirmDemoPayment(job, text);
}

export async function retryJob(
  job: ContractJobResponse,
  text: string,
): Promise<ContractJobResponse> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/v1/jobs/${job.job_id}/retry`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(await res.text());
    const retried = (await res.json()) as ContractJobResponse;
    if (retried.status !== "processing") {
      return retried;
    }

    return (await waitForJobCompletion(job.job_id)) ?? retried;
  }

  return retryDemoJob(job, text);
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
