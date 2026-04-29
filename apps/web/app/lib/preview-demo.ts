import type {
  CheckoutSessionRequest,
  ContractJobResponse,
  ConversationMessage,
  FollowUpResponse,
  InputType,
  Market,
  PaymentQuote,
  PreviewAnalysisResponse,
  PreviewIntakeRequest,
  SampleContract,
  UrlIntakeRequest,
} from "./types";

const apiBaseUrl = process.env.NEXT_PUBLIC_CHEKA_API_URL?.replace(/\/$/, "") ?? "";

export const sampleContracts: SampleContract[] = [
  {
    id: "lease-high-risk",
    title: "Lease with renewal risk",
    source_name: "residential-lease.pdf",
    market: "south_africa",
    input_type: "pdf",
    text:
      "This lease agreement creates a fixed term of twelve months for the tenant. The lease renews automatically unless the tenant gives notice in writing thirty days before the end date. Utilities are billed separately and the landlord is not liable for any loss caused by interrupted services. A penalty for early cancellation applies if the tenant leaves before the minimum term ends. The tenant indemnifies the landlord against all third-party claims.",
  },
  {
    id: "employment-medium-risk",
    title: "Employment contract with non-compete",
    source_name: "employment-offer.docx",
    market: "kenya",
    input_type: "docx",
    text:
      "The employee will receive a monthly salary of KES 180,000 and a discretionary performance bonus. The employee accepts a non-compete obligation for twelve months after termination across the East Africa region and agrees that disputes will be resolved by binding arbitration. The employer may terminate employment with notice, while the employee must repay training costs if they resign within six months.",
  },
  {
    id: "service-lower-risk",
    title: "Service agreement with cleaner terms",
    source_name: "design-services.docx",
    market: "south_africa",
    input_type: "docx",
    text:
      "This service agreement sets out the scope of work, milestones, and payment schedule. Either party may terminate the agreement on fourteen days written notice. Fees are limited to the approved quote and no automatic renewal clause applies. The parties will first try to resolve disputes in good faith before taking formal action.",
  },
];

function buildPaymentQuote(market: Market): PaymentQuote {
  const ref = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  const paymentReference = `cheka-${market.slice(0, 2)}-${ref}`;
  return {
    provider: "paystack",
    payment_status: "unpaid",
    payment_reference: paymentReference,
    checkout_url: `https://paystack.example/checkout/${paymentReference}`,
    display_amount: market === "kenya" ? "KES 180" : "ZAR 35",
    note: "Demo checkout placeholder. Replace with live Paystack session before launch.",
  };
}

function nowIso() {
  return new Date().toISOString();
}

function newJobId() {
  const ref = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2);
  return `job_${ref.slice(0, 12)}`;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJobCompletion(jobId: string, attempts = 12, delayMs = 1000): Promise<ContractJobResponse | null> {
  if (!apiBaseUrl) return null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await sleep(delayMs);
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${jobId}`);
    if (!response.ok) throw new Error(await response.text());
    const job = (await response.json()) as ContractJobResponse;
    if (job.status === "completed" || job.status === "failed") return job;
  }
  return null;
}

export function usingExternalApi() {
  return Boolean(apiBaseUrl);
}

interface AnalyzeApiResponse {
  analysis: PreviewAnalysisResponse;
  text: string;
  market: Market;
  source_name?: string;
  input_type?: InputType;
  engine: "openai" | "rules";
  extraction: string;
}

async function callInternalAnalyze(body: BodyInit, headers?: HeadersInit): Promise<AnalyzeApiResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    body,
    headers,
  });
  if (!response.ok) {
    let message = "The analysis service returned an error.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      message = (await response.text()) || message;
    }
    throw new Error(message);
  }
  return (await response.json()) as AnalyzeApiResponse;
}

function detectInputTypeFromFile(file: File): InputType {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (type.includes("word") || name.endsWith(".docx")) return "docx";
  if (type.includes("image") || /\.(png|jpg|jpeg|webp)$/.test(name)) return "image";
  return "pdf";
}

export async function createPreviewJob(payload: PreviewIntakeRequest): Promise<ContractJobResponse> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/preview-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as ContractJobResponse;
  }

  const timestamp = nowIso();
  return {
    job_id: newJobId(),
    status: "pending",
    input_type: payload.input_type,
    market: payload.market,
    source_name: payload.source_name,
    customer_email: payload.customer_email,
    disclaimer_accepted: payload.disclaimer_accepted,
    payment: buildPaymentQuote(payload.market),
    analysis: null,
    conversation: [],
    follow_up: { free_limit: 3, questions_used: 0, questions_remaining: 3 },
    escalation_recommended: false,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function createUrlPreviewJob(payload: UrlIntakeRequest): Promise<ContractJobResponse> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/intake-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as ContractJobResponse;
  }

  const timestamp = nowIso();
  return {
    job_id: newJobId(),
    status: "pending",
    input_type: "url",
    market: payload.market,
    source_name: payload.source_name ?? payload.url,
    customer_email: payload.customer_email,
    disclaimer_accepted: payload.disclaimer_accepted,
    payment: buildPaymentQuote(payload.market),
    analysis: null,
    conversation: [],
    follow_up: { free_limit: 3, questions_used: 0, questions_remaining: 3 },
    escalation_recommended: false,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function createFilePreviewJob(args: {
  file: File;
  market: Market;
  customer_email?: string;
  disclaimer_accepted: boolean;
  source_name?: string;
}): Promise<ContractJobResponse> {
  if (apiBaseUrl) {
    const formData = new FormData();
    formData.append("file", args.file);
    formData.append("market", args.market);
    formData.append("disclaimer_accepted", String(args.disclaimer_accepted));
    if (args.customer_email) formData.append("customer_email", args.customer_email);
    if (args.source_name ?? args.file.name) {
      formData.append("source_name", args.source_name ?? args.file.name);
    }
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/intake-file`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as ContractJobResponse;
  }

  const timestamp = nowIso();
  return {
    job_id: newJobId(),
    status: "pending",
    input_type: detectInputTypeFromFile(args.file),
    market: args.market,
    source_name: args.source_name ?? args.file.name,
    customer_email: args.customer_email,
    disclaimer_accepted: args.disclaimer_accepted,
    payment: buildPaymentQuote(args.market),
    analysis: null,
    conversation: [],
    follow_up: { free_limit: 3, questions_used: 0, questions_remaining: 3 },
    escalation_recommended: false,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function initializeCheckout(
  job: ContractJobResponse,
  payload: CheckoutSessionRequest = {},
): Promise<ContractJobResponse> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${job.job_id}/checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as ContractJobResponse;
  }

  return {
    ...job,
    status: "payment_pending",
    customer_email: payload.customer_email ?? job.customer_email,
    payment: {
      ...job.payment,
      checkout_url: job.payment.checkout_url,
      note: "Demo mode uses a placeholder checkout URL before payment is simulated.",
    },
    updated_at: nowIso(),
  };
}

export interface RunPreviewArgs {
  text?: string;
  file?: File;
  url?: string;
  market: Market;
  source_name?: string;
  input_type?: InputType;
}

export interface RunPreviewResult {
  analysis: PreviewAnalysisResponse;
  text: string;
  source_name?: string;
  input_type?: InputType;
  engine: "openai" | "rules";
  extraction: string;
}

export async function runPreviewAnalysis(args: RunPreviewArgs): Promise<RunPreviewResult> {
  if (args.file) {
    const formData = new FormData();
    formData.append("file", args.file);
    formData.append("market", args.market);
    if (args.source_name) formData.append("source_name", args.source_name);
    if (args.text) formData.append("text", args.text);
    const result = await callInternalAnalyze(formData);
    return {
      analysis: result.analysis,
      text: result.text,
      source_name: result.source_name,
      input_type: result.input_type,
      engine: result.engine,
      extraction: result.extraction,
    };
  }

  const payload: Record<string, unknown> = {
    market: args.market,
    source_name: args.source_name,
    input_type: args.input_type,
  };
  if (args.url) payload.url = args.url;
  if (args.text) payload.text = args.text;

  const result = await callInternalAnalyze(JSON.stringify(payload), {
    "Content-Type": "application/json",
  });
  return {
    analysis: result.analysis,
    text: result.text,
    source_name: result.source_name,
    input_type: result.input_type,
    engine: result.engine,
    extraction: result.extraction,
  };
}

export async function confirmPayment(
  job: ContractJobResponse,
  context: { text?: string; file?: File; url?: string; sourceName?: string; inputType?: InputType },
): Promise<ContractJobResponse> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${job.job_id}/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_reference: job.payment.payment_reference }),
    });
    if (!response.ok) throw new Error(await response.text());
    const confirmed = (await response.json()) as ContractJobResponse;
    if (confirmed.status !== "processing") return confirmed;
    return (await waitForJobCompletion(job.job_id)) ?? confirmed;
  }

  const result = await runPreviewAnalysis({
    text: context.text,
    file: context.file,
    url: context.url,
    market: job.market,
    source_name: context.sourceName ?? job.source_name ?? undefined,
    input_type: context.inputType ?? job.input_type,
  });

  return {
    ...job,
    status: "completed",
    payment: { ...job.payment, payment_status: "paid" },
    analysis: result.analysis,
    source_name: result.source_name ?? job.source_name,
    input_type: result.input_type ?? job.input_type,
    escalation_recommended: result.analysis.risk_level === "high",
    updated_at: nowIso(),
  };
}

export async function retryJob(
  job: ContractJobResponse,
  context: { text?: string; file?: File; url?: string; sourceName?: string; inputType?: InputType },
): Promise<ContractJobResponse> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${job.job_id}/retry`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(await response.text());
    const retried = (await response.json()) as ContractJobResponse;
    if (retried.status !== "processing") return retried;
    return (await waitForJobCompletion(job.job_id)) ?? retried;
  }

  if (job.payment.payment_status !== "paid") {
    throw new Error("Payment must be confirmed before retrying a failed job.");
  }

  const result = await runPreviewAnalysis({
    text: context.text,
    file: context.file,
    url: context.url,
    market: job.market,
    source_name: context.sourceName ?? job.source_name ?? undefined,
    input_type: context.inputType ?? job.input_type,
  });

  return {
    ...job,
    status: "completed",
    analysis: result.analysis,
    escalation_recommended: result.analysis.risk_level === "high",
    updated_at: nowIso(),
  };
}

export async function askFollowUp(
  job: ContractJobResponse,
  question: string,
): Promise<{ job: ContractJobResponse; response: FollowUpResponse }> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${job.job_id}/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) throw new Error(await response.text());
    const payload = (await response.json()) as FollowUpResponse;
    return {
      response: payload,
      job: { ...job, conversation: payload.conversation, follow_up: payload.follow_up, updated_at: nowIso() },
    };
  }

  if (!job.analysis) throw new Error("Unlock the analysis before asking follow-up questions.");

  if (job.follow_up.questions_remaining <= 0) {
    const capped: FollowUpResponse = {
      job_id: job.job_id,
      answer:
        "You have used the 3 free follow-up questions for this contract. Save the summary or prepare for the subscription upgrade flow before continuing.",
      follow_up: job.follow_up,
      conversation: job.conversation,
      upgrade_required: true,
      suggested_next_step: "Prompt the user to subscribe for unlimited follow-up questions.",
    };
    return { job, response: capped };
  }

  const apiResponse = await fetch("/api/follow-up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      analysis: job.analysis,
      history: job.conversation.map((msg) => ({ role: msg.role, content: msg.content })),
    }),
  });

  if (!apiResponse.ok) {
    let message = "Unable to ask follow-up.";
    try {
      const data = (await apiResponse.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      message = (await apiResponse.text()) || message;
    }
    throw new Error(message);
  }

  const data = (await apiResponse.json()) as {
    answer: string;
    suggested_next_step?: string | null;
  };

  const questionMessage: ConversationMessage = { role: "user", content: question, timestamp: nowIso() };
  const answerMessage: ConversationMessage = { role: "assistant", content: data.answer, timestamp: nowIso() };
  const updatedConversation = [...job.conversation, questionMessage, answerMessage];
  const updatedFollowUp = {
    ...job.follow_up,
    questions_used: job.follow_up.questions_used + 1,
    questions_remaining: Math.max(job.follow_up.questions_remaining - 1, 0),
  };

  const followUp: FollowUpResponse = {
    job_id: job.job_id,
    answer: data.answer,
    follow_up: updatedFollowUp,
    conversation: updatedConversation,
    upgrade_required: false,
    suggested_next_step: data.suggested_next_step ?? null,
  };

  return {
    response: followUp,
    job: { ...job, conversation: updatedConversation, follow_up: updatedFollowUp, updated_at: nowIso() },
  };
}
