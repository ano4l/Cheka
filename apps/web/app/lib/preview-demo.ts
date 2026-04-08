import type {
  ContractJobResponse,
  ConversationMessage,
  FollowUpResponse,
  Market,
  PaymentQuote,
  PreviewAnalysisResponse,
  PreviewIntakeRequest,
  RiskClassification,
  RiskFactor,
  SampleContract,
} from "./types";

const apiBaseUrl = process.env.NEXT_PUBLIC_CHEKA_API_URL?.replace(/\/$/, "") ?? "";

const riskRules = [
  ["auto_renewal", "Auto-renewal", 18, "The contract may renew unless the user gives advance notice.", [/automatic(?:ally)? renew/i, /renews? automatically/i]],
  ["cancellation_penalty", "Cancellation penalty", 16, "Leaving the agreement early may trigger extra fees or penalties.", [/penalt(?:y|ies) for early cancellation/i, /termination fee/i]],
  ["hidden_fees", "Hidden fees", 14, "The contract references additional costs that may not be capped or clearly itemized.", [/additional fees?/i, /administration fee/i, /billed separately/i]],
  ["non_compete", "Non-compete clause", 20, "The agreement may restrict work or business activity after the relationship ends.", [/non-?compete/i, /shall not engage in any competing business/i]],
  ["lock_in", "Long-term lock-in", 15, "The user may be tied into the contract for a long minimum period.", [/minimum term of \w+/i, /locked in for/i, /fixed term of \w+/i]],
  ["liability_imbalance", "Liability imbalance", 17, "Responsibility or damages appear to fall unevenly on one party.", [/indemnif(?:y|ication)/i, /not liable for any loss/i, /sole liability/i]],
  ["arbitration", "Arbitration clause", 10, "Disputes may be forced into arbitration instead of court.", [/binding arbitration/i, /resolved by arbitration/i]],
] as const;

export const sampleContracts: SampleContract[] = [
  {
    id: "lease-high-risk",
    title: "Lease with renewal risk",
    source_name: "residential-lease.pdf",
    market: "south_africa",
    input_type: "pdf",
    text:
      "This lease agreement creates a fixed term of twelve months for the tenant. The lease renews automatically unless the tenant gives notice in writing thirty days before the end date. Utilities are billed separately and the landlord is not liable for any loss caused by interrupted services. A penalty for early cancellation applies if the tenant leaves before the minimum term ends.",
  },
  {
    id: "employment-medium-risk",
    title: "Employment contract with non-compete",
    source_name: "employment-offer.docx",
    market: "kenya",
    input_type: "docx",
    text:
      "The employee will receive a monthly salary and a performance bonus. The employee accepts a non-compete obligation for twelve months after termination and agrees that disputes will be resolved by binding arbitration. The employer may terminate employment with notice, while the employee must repay training costs if they resign within six months.",
  },
  {
    id: "service-lower-risk",
    title: "Service agreement with cleaner terms",
    source_name: "design-services-url",
    market: "south_africa",
    input_type: "url",
    text:
      "This service agreement sets out the scope of work, milestones, and payment schedule. Either party may terminate the agreement on fourteen days written notice. Fees are limited to the approved quote and no automatic renewal clause applies. The parties will first try to resolve disputes in good faith before taking formal action.",
  },
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function splitSentences(text: string) {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function detectContractType(text: string) {
  const normalized = text.toLowerCase();
  const contracts = [
    ["lease agreement", ["lease", "landlord", "tenant", "rent", "premises"]],
    ["employment contract", ["employee", "employer", "salary", "non-compete", "termination"]],
    ["service agreement", ["services", "service provider", "scope of work", "deliverables"]],
    ["loan agreement", ["loan", "interest", "repayment", "borrower", "lender"]],
    ["subscription agreement", ["subscription", "renew", "monthly plan", "membership"]],
  ] as const;

  for (const [label, keywords] of contracts) {
    if (keywords.filter((keyword) => normalized.includes(keyword)).length >= 2) {
      return label;
    }
  }

  return "general contract";
}

function classifyRisk(score: number): RiskClassification {
  if (score >= 60) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function pickMatchingSentences(sentences: string[], keywords: string[]) {
  return sentences.filter((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword))).slice(0, 2);
}

function buildRecommendedActions(factors: RiskFactor[], riskLevel: RiskClassification) {
  const keys = new Set(factors.map((factor) => factor.key));
  const actions: string[] = [];

  if (keys.has("auto_renewal")) actions.push("Ask for the renewal notice period and whether renewal can be disabled before signing.");
  if (keys.has("cancellation_penalty") || keys.has("lock_in")) actions.push("Clarify the exact cancellation cost, notice requirement, and minimum commitment period.");
  if (keys.has("hidden_fees")) actions.push("Request a written fee schedule that lists every recurring and one-off charge.");
  if (keys.has("liability_imbalance")) actions.push("Check whether liability and indemnity obligations can be made more balanced.");
  if (riskLevel === "high") actions.push("Consider pausing signature and escalating the contract for legal review.");
  if (actions.length === 0) actions.push("Confirm the practical payment, renewal, and termination terms in writing before signing.");

  return actions.slice(0, 3);
}

function buildPreviewAnalysis(text: string): PreviewAnalysisResponse {
  const normalized = normalizeText(text);
  const sentences = splitSentences(normalized);

  const factors = riskRules.flatMap(([key, label, weight, explanation, patterns]) => {
    const match = patterns.map((pattern) => pattern.exec(normalized)).find(Boolean);
    if (!match || match.index === undefined) return [];

    return [{
      key,
      label,
      weight,
      evidence: normalized.slice(Math.max(match.index - 40, 0), Math.min(match.index + match[0].length + 70, normalized.length)).trim(),
      explanation,
    }];
  });

  const riskScore = Math.min(factors.reduce((total, factor) => total + factor.weight, 0), 100);
  const riskLevel = classifyRisk(riskScore);

  return {
    contract_type: detectContractType(text),
    summary: factors.length > 0
      ? `The preview found signals related to ${factors.slice(0, 3).map((factor) => factor.label.toLowerCase()).join(", ")}. A full AI review should confirm whether those clauses are enforceable and how they interact.`
      : "The preview did not match the launch-rule risk patterns, but the contract should still go through full AI analysis.",
    key_points: sentences.length > 0 ? sentences.slice(0, 3) : ["Normalized contract text will appear here after extraction."],
    red_flags: factors.map((factor) => `${factor.label}: ${factor.explanation} Evidence: ${factor.evidence}`),
    risk_score: riskScore,
    risk_level: riskLevel,
    factors,
    financial_obligations: pickMatchingSentences(sentences, ["fee", "fees", "cost", "costs", "payment", "rent", "billed", "price", "penalty", "salary"]),
    duration_terms: pickMatchingSentences(sentences, ["term", "month", "months", "year", "years", "renew", "renewal", "duration"]),
    cancellation_terms: pickMatchingSentences(sentences, ["cancel", "cancellation", "terminate", "termination", "notice", "exit"]),
    recommended_actions: buildRecommendedActions(factors, riskLevel),
  };
}

function buildPaymentQuote(market: Market): PaymentQuote {
  const paymentReference = `cheka-${market.slice(0, 2)}-${crypto.randomUUID().slice(0, 8)}`;
  return {
    provider: "paystack",
    payment_status: "unpaid",
    payment_reference: paymentReference,
    checkout_url: `https://paystack.example/checkout/${paymentReference}`,
    display_amount: "Market-based launch pricing",
    note: "Demo checkout placeholder. Replace this with live pricing and a real Paystack session before launch.",
  };
}

function nowIso() {
  return new Date().toISOString();
}

function buildFollowUpAnswer(analysis: PreviewAnalysisResponse, question: string) {
  const normalized = question.toLowerCase();
  const firstAction = analysis.recommended_actions[0] ?? null;

  if (normalized.includes("cancel") || normalized.includes("termination") || normalized.includes("exit")) {
    const factor = analysis.factors.find((item) => ["cancellation_penalty", "lock_in", "auto_renewal"].includes(item.key));
    return { answer: factor ? `${factor.label}: ${factor.explanation}` : "The preview did not find a strong cancellation signal, so confirm notice periods and exit costs in the full contract.", suggested_next_step: firstAction };
  }
  if (normalized.includes("renew")) {
    const factor = analysis.factors.find((item) => ["auto_renewal", "lock_in"].includes(item.key));
    return { answer: factor ? `${factor.label}: ${factor.explanation}` : "The preview did not flag renewal language, but the full review should still confirm whether the contract continues automatically.", suggested_next_step: firstAction };
  }
  if (normalized.includes("fee") || normalized.includes("cost") || normalized.includes("pay") || normalized.includes("money")) {
    const factor = analysis.factors.find((item) => ["hidden_fees", "cancellation_penalty"].includes(item.key));
    const paymentLine = analysis.financial_obligations[0];
    return { answer: paymentLine ? `${factor ? `${factor.label}: ${factor.explanation} ` : ""}Key payment language: ${paymentLine}` : "The preview did not isolate a clear payment clause, so ask for a full fee breakdown before signing.", suggested_next_step: firstAction };
  }
  if (normalized.includes("safe") || normalized.includes("sign") || normalized.includes("agree")) {
    if (analysis.risk_level === "high") return { answer: `This preview leans high risk, so signing without clarification would be hard to recommend. Focus first on: ${firstAction ?? "clarifying the flagged terms."}`, suggested_next_step: firstAction };
    if (analysis.risk_level === "medium") return { answer: `This contract may still be workable, but only after clarifying the flagged terms. Start with: ${firstAction ?? "the main obligations."}`, suggested_next_step: firstAction };
    return { answer: "The preview looks relatively low risk, but it is still worth confirming the practical obligations in writing before you sign.", suggested_next_step: firstAction };
  }

  return {
    answer: analysis.red_flags[0] ?? "The preview did not surface major launch-rule red flags. A full AI review should still confirm obligations, renewal terms, and dispute handling.",
    suggested_next_step: firstAction,
  };
}

export function usingExternalApi() {
  return Boolean(apiBaseUrl);
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
    job_id: `job_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`,
    status: "payment_required",
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

export async function confirmPayment(job: ContractJobResponse, text: string): Promise<ContractJobResponse> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${job.job_id}/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_reference: job.payment.payment_reference }),
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as ContractJobResponse;
  }

  const analysis = buildPreviewAnalysis(text);
  return {
    ...job,
    status: "complete",
    payment: { ...job.payment, payment_status: "paid" },
    analysis,
    escalation_recommended: analysis.risk_level === "high",
    updated_at: nowIso(),
  };
}

export async function askFollowUp(job: ContractJobResponse, question: string): Promise<{ job: ContractJobResponse; response: FollowUpResponse }> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/jobs/${job.job_id}/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) throw new Error(await response.text());
    const payload = (await response.json()) as FollowUpResponse;
    return { response: payload, job: { ...job, conversation: payload.conversation, follow_up: payload.follow_up, updated_at: nowIso() } };
  }

  if (!job.analysis) throw new Error("Unlock the analysis before asking follow-up questions.");

  if (job.follow_up.questions_remaining <= 0) {
    const capped: FollowUpResponse = {
      job_id: job.job_id,
      answer: "You have used the 3 free follow-up questions for this contract. Save the summary or prepare for the subscription upgrade flow before continuing.",
      follow_up: job.follow_up,
      conversation: job.conversation,
      upgrade_required: true,
      suggested_next_step: "Prompt the user to subscribe for unlimited follow-up questions.",
    };
    return { job, response: capped };
  }

  const questionMessage: ConversationMessage = { role: "user", content: question, timestamp: nowIso() };
  const followUp = buildFollowUpAnswer(job.analysis, question);
  const answerMessage: ConversationMessage = { role: "assistant", content: followUp.answer, timestamp: nowIso() };
  const updatedConversation = [...job.conversation, questionMessage, answerMessage];
  const updatedFollowUp = {
    ...job.follow_up,
    questions_used: job.follow_up.questions_used + 1,
    questions_remaining: Math.max(job.follow_up.questions_remaining - 1, 0),
  };

  return {
    response: {
      job_id: job.job_id,
      answer: followUp.answer,
      follow_up: updatedFollowUp,
      conversation: updatedConversation,
      upgrade_required: false,
      suggested_next_step: followUp.suggested_next_step,
    },
    job: { ...job, conversation: updatedConversation, follow_up: updatedFollowUp, updated_at: nowIso() },
  };
}
