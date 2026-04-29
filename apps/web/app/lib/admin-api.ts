import type {
  ContractJobResponse,
  JobMetricsResponse,
  JobStatus,
  Market,
  PaymentStatus,
} from "./types";

const apiBaseUrl = process.env.NEXT_PUBLIC_CHEKA_API_URL?.replace(/\/$/, "") ?? "";
const adminStudioEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN_STUDIO === "true";

function assertAdminStudioReady() {
  if (!adminStudioEnabled) {
    throw new Error("Admin studio is disabled. Set NEXT_PUBLIC_ENABLE_ADMIN_STUDIO=true to enable it.");
  }

  if (!apiBaseUrl) {
    throw new Error("Set NEXT_PUBLIC_CHEKA_API_URL before using the admin studio.");
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJobCompletion(jobId: string, attempts = 12, delayMs = 1000): Promise<ContractJobResponse | null> {
  if (!apiBaseUrl) {
    return null;
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await sleep(delayMs);
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${jobId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const job = (await response.json()) as ContractJobResponse;
    if (job.status === "completed" || job.status === "failed") {
      return job;
    }
  }

  return null;
}

export function usingAdminStudio() {
  return adminStudioEnabled && Boolean(apiBaseUrl);
}

export async function listAdminJobs(args: {
  status?: JobStatus;
  paymentStatus?: PaymentStatus;
  market?: Market;
  limit?: number;
} = {}): Promise<ContractJobResponse[]> {
  assertAdminStudioReady();

  const params = new URLSearchParams();
  if (args.status) {
    params.set("status", args.status);
  }
  if (args.paymentStatus) {
    params.set("payment_status", args.paymentStatus);
  }
  if (args.market) {
    params.set("market", args.market);
  }
  params.set("limit", String(args.limit ?? 40));

  const response = await fetch(`${apiBaseUrl}/api/v1/jobs?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as ContractJobResponse[];
}

export async function getAdminJob(jobId: string): Promise<ContractJobResponse> {
  assertAdminStudioReady();

  const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${jobId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as ContractJobResponse;
}

export async function getAdminJobMetrics(args: {
  status?: JobStatus;
  paymentStatus?: PaymentStatus;
  market?: Market;
} = {}): Promise<JobMetricsResponse> {
  assertAdminStudioReady();

  const params = new URLSearchParams();
  if (args.status) {
    params.set("status", args.status);
  }
  if (args.paymentStatus) {
    params.set("payment_status", args.paymentStatus);
  }
  if (args.market) {
    params.set("market", args.market);
  }

  const query = params.toString();
  const response = await fetch(
    `${apiBaseUrl}/api/v1/jobs/metrics${query ? `?${query}` : ""}`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as JobMetricsResponse;
}

export async function retryAdminJob(jobId: string): Promise<ContractJobResponse> {
  assertAdminStudioReady();

  const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${jobId}/retry`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const retried = (await response.json()) as ContractJobResponse;
  if (retried.status !== "processing") {
    return retried;
  }

  return (await waitForJobCompletion(jobId)) ?? retried;
}

export async function confirmAdminPayment(
  jobId: string,
  paymentReference?: string,
): Promise<ContractJobResponse> {
  assertAdminStudioReady();

  const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${jobId}/confirm-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payment_reference: paymentReference,
    }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const confirmed = (await response.json()) as ContractJobResponse;
  if (confirmed.status !== "processing") {
    return confirmed;
  }

  return (await waitForJobCompletion(jobId)) ?? confirmed;
}
