import type {
  PreviewAnalysisResponse,
  RiskClassification,
  RiskFactor,
} from "./types";

const riskRules = [
  [
    "auto_renewal",
    "Auto-renewal",
    18,
    "The contract may renew unless the user gives advance notice.",
    [/automatic(?:ally)? renew/i, /renews? automatically/i, /shall automatically renew/i],
  ],
  [
    "cancellation_penalty",
    "Cancellation penalty",
    16,
    "Leaving the agreement early may trigger extra fees or penalties.",
    [/penalt(?:y|ies) for early cancellation/i, /termination fee/i, /early termination/i],
  ],
  [
    "hidden_fees",
    "Hidden fees",
    14,
    "The contract references additional costs that may not be capped or clearly itemized.",
    [/additional fees?/i, /administration fee/i, /billed separately/i, /service charge/i],
  ],
  [
    "non_compete",
    "Non-compete clause",
    20,
    "The agreement may restrict work or business activity after the relationship ends.",
    [/non-?compete/i, /shall not engage in any competing business/i, /restraint of trade/i],
  ],
  [
    "lock_in",
    "Long-term lock-in",
    15,
    "The user may be tied into the contract for a long minimum period.",
    [/minimum term of \w+/i, /locked in for/i, /fixed term of \w+/i, /minimum commitment/i],
  ],
  [
    "liability_imbalance",
    "Liability imbalance",
    17,
    "Responsibility or damages appear to fall unevenly on one party.",
    [/indemnif(?:y|ication)/i, /not liable for any loss/i, /sole liability/i, /hold harmless/i],
  ],
  [
    "arbitration",
    "Arbitration clause",
    10,
    "Disputes may be forced into arbitration instead of court.",
    [/binding arbitration/i, /resolved by arbitration/i, /waive.*right.*jury/i],
  ],
] as const;

export function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function splitSentences(text: string) {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function detectContractType(text: string) {
  const normalized = text.toLowerCase();
  const contracts = [
    ["lease agreement", ["lease", "landlord", "tenant", "rent", "premises"]],
    ["employment contract", ["employee", "employer", "salary", "non-compete", "termination"]],
    ["service agreement", ["services", "service provider", "scope of work", "deliverables"]],
    ["loan agreement", ["loan", "interest", "repayment", "borrower", "lender"]],
    ["subscription agreement", ["subscription", "renew", "monthly plan", "membership"]],
    ["non-disclosure agreement", ["confidential", "non-disclosure", "nda", "proprietary"]],
  ] as const;

  for (const [label, keywords] of contracts) {
    if (keywords.filter((keyword) => normalized.includes(keyword)).length >= 2) {
      return label;
    }
  }

  return "general contract";
}

export function classifyRisk(score: number): RiskClassification {
  if (score >= 60) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function pickMatchingSentences(sentences: string[], keywords: string[]) {
  return sentences
    .filter((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword)))
    .slice(0, 2);
}

function buildRecommendedActions(factors: RiskFactor[], riskLevel: RiskClassification) {
  const keys = new Set(factors.map((factor) => factor.key));
  const actions: string[] = [];

  if (keys.has("auto_renewal"))
    actions.push("Ask for the renewal notice period and whether renewal can be disabled before signing.");
  if (keys.has("cancellation_penalty") || keys.has("lock_in"))
    actions.push("Clarify the exact cancellation cost, notice requirement, and minimum commitment period.");
  if (keys.has("hidden_fees"))
    actions.push("Request a written fee schedule that lists every recurring and one-off charge.");
  if (keys.has("liability_imbalance"))
    actions.push("Check whether liability and indemnity obligations can be made more balanced.");
  if (keys.has("non_compete"))
    actions.push("Negotiate the non-compete scope, geography, and duration before accepting.");
  if (riskLevel === "high")
    actions.push("Consider pausing signature and escalating the contract for legal review.");
  if (actions.length === 0)
    actions.push("Confirm the practical payment, renewal, and termination terms in writing before signing.");

  return actions.slice(0, 4);
}

export function buildRuleAnalysis(text: string): PreviewAnalysisResponse {
  const normalized = normalizeText(text);
  const sentences = splitSentences(normalized);

  const factors: RiskFactor[] = riskRules.flatMap(([key, label, weight, explanation, patterns]) => {
    const match = patterns.map((pattern) => pattern.exec(normalized)).find(Boolean);
    if (!match || match.index === undefined) return [];

    return [
      {
        key,
        label,
        weight,
        evidence: normalized
          .slice(Math.max(match.index - 40, 0), Math.min(match.index + match[0].length + 70, normalized.length))
          .trim(),
        explanation,
      },
    ];
  });

  const riskScore = Math.min(
    factors.reduce((total, factor) => total + factor.weight, 0),
    100,
  );
  const riskLevel = classifyRisk(riskScore);

  return {
    contract_type: detectContractType(text),
    summary:
      factors.length > 0
        ? `The preview found signals related to ${factors
            .slice(0, 3)
            .map((factor) => factor.label.toLowerCase())
            .join(", ")}. A full review should confirm whether those clauses are enforceable and how they interact.`
        : "The preview did not match the launch-rule risk patterns, but the contract should still go through full AI analysis.",
    key_points:
      sentences.length > 0 ? sentences.slice(0, 3) : ["Normalized contract text will appear here after extraction."],
    red_flags: factors.map((factor) => `${factor.label}: ${factor.explanation} Evidence: ${factor.evidence}`),
    risk_score: riskScore,
    risk_level: riskLevel,
    factors,
    financial_obligations: pickMatchingSentences(sentences, [
      "fee",
      "fees",
      "cost",
      "costs",
      "payment",
      "rent",
      "billed",
      "price",
      "penalty",
      "salary",
    ]),
    duration_terms: pickMatchingSentences(sentences, [
      "term",
      "month",
      "months",
      "year",
      "years",
      "renew",
      "renewal",
      "duration",
    ]),
    cancellation_terms: pickMatchingSentences(sentences, [
      "cancel",
      "cancellation",
      "terminate",
      "termination",
      "notice",
      "exit",
    ]),
    recommended_actions: buildRecommendedActions(factors, riskLevel),
  };
}

export function buildRuleFollowUpAnswer(analysis: PreviewAnalysisResponse, question: string) {
  const normalized = question.toLowerCase();
  const firstAction = analysis.recommended_actions[0] ?? null;

  if (normalized.includes("cancel") || normalized.includes("termination") || normalized.includes("exit")) {
    const factor = analysis.factors.find((item) =>
      ["cancellation_penalty", "lock_in", "auto_renewal"].includes(item.key),
    );
    return {
      answer: factor
        ? `${factor.label}: ${factor.explanation}`
        : "The preview did not find a strong cancellation signal, so confirm notice periods and exit costs in the full contract.",
      suggested_next_step: firstAction,
    };
  }
  if (normalized.includes("renew")) {
    const factor = analysis.factors.find((item) => ["auto_renewal", "lock_in"].includes(item.key));
    return {
      answer: factor
        ? `${factor.label}: ${factor.explanation}`
        : "The preview did not flag renewal language, but the full review should still confirm whether the contract continues automatically.",
      suggested_next_step: firstAction,
    };
  }
  if (
    normalized.includes("fee") ||
    normalized.includes("cost") ||
    normalized.includes("pay") ||
    normalized.includes("money")
  ) {
    const factor = analysis.factors.find((item) =>
      ["hidden_fees", "cancellation_penalty"].includes(item.key),
    );
    const paymentLine = analysis.financial_obligations[0];
    return {
      answer: paymentLine
        ? `${factor ? `${factor.label}: ${factor.explanation} ` : ""}Key payment language: ${paymentLine}`
        : "The preview did not isolate a clear payment clause, so ask for a full fee breakdown before signing.",
      suggested_next_step: firstAction,
    };
  }
  if (normalized.includes("safe") || normalized.includes("sign") || normalized.includes("agree")) {
    if (analysis.risk_level === "high")
      return {
        answer: `This preview leans high risk, so signing without clarification would be hard to recommend. Focus first on: ${
          firstAction ?? "clarifying the flagged terms."
        }`,
        suggested_next_step: firstAction,
      };
    if (analysis.risk_level === "medium")
      return {
        answer: `This contract may still be workable, but only after clarifying the flagged terms. Start with: ${
          firstAction ?? "the main obligations."
        }`,
        suggested_next_step: firstAction,
      };
    return {
      answer:
        "The preview looks relatively low risk, but it is still worth confirming the practical obligations in writing before you sign.",
      suggested_next_step: firstAction,
    };
  }

  return {
    answer:
      analysis.red_flags[0] ??
      "The preview did not surface major launch-rule red flags. A full AI review should still confirm obligations, renewal terms, and dispute handling.",
    suggested_next_step: firstAction,
  };
}
