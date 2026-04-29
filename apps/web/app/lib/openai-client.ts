import OpenAI from "openai";

import type { PreviewAnalysisResponse, RiskClassification, RiskFactor } from "./types";
import { classifyRisk } from "./risk-engine";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

export function isOpenAIEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

const ANALYSIS_SYSTEM_PROMPT = `You are Cheka, a contract intelligence assistant focused on protecting everyday people in South Africa and Kenya from unfair clauses. You analyse contracts in plain language and return structured JSON only.

Risk scoring rubric:
- 0-24 = low risk, 25-59 = medium risk, 60-100 = high risk
- Weight common red flags heavily: auto-renewal, cancellation penalty, hidden fees, non-compete, long lock-in, liability imbalance, forced arbitration, indemnity overload.
- Quote short verbatim evidence (under 25 words) directly from the contract for each factor.

Return ONLY valid JSON matching this exact shape (no prose, no markdown fences):
{
  "contract_type": string,
  "summary": string,
  "key_points": string[3-5],
  "red_flags": string[],
  "risk_score": number,
  "risk_level": "low" | "medium" | "high",
  "factors": Array<{ "key": string, "label": string, "weight": number, "evidence": string, "explanation": string }>,
  "financial_obligations": string[],
  "duration_terms": string[],
  "cancellation_terms": string[],
  "recommended_actions": string[3-5]
}

Be concrete: name actual amounts, dates, and durations. Recommend specific actions the user should take before signing.`;

const FOLLOW_UP_SYSTEM_PROMPT = `You are Cheka, a contract intelligence assistant. Answer the user's follow-up question about the analysed contract with a clear, plain-language response (under 120 words). Reference specific clauses or evidence from the analysis when possible. Always lean on the cautious, user-protective side. Return JSON only: {"answer": string, "suggested_next_step": string | null}.`;

interface RawAnalysis {
  contract_type?: string;
  summary?: string;
  key_points?: string[];
  red_flags?: string[];
  risk_score?: number;
  risk_level?: string;
  factors?: Array<Partial<RiskFactor>>;
  financial_obligations?: string[];
  duration_terms?: string[];
  cancellation_terms?: string[];
  recommended_actions?: string[];
}

function coerceArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function coerceFactors(value: unknown): RiskFactor[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const factor = item as Partial<RiskFactor>;
    if (!factor.key || !factor.label) return [];
    return [
      {
        key: String(factor.key),
        label: String(factor.label),
        weight: typeof factor.weight === "number" ? factor.weight : 10,
        evidence: typeof factor.evidence === "string" ? factor.evidence : "",
        explanation: typeof factor.explanation === "string" ? factor.explanation : "",
      },
    ];
  });
}

function normalizeRiskLevel(raw: RawAnalysis): RiskClassification {
  if (raw.risk_level === "low" || raw.risk_level === "medium" || raw.risk_level === "high") {
    return raw.risk_level;
  }
  if (typeof raw.risk_score === "number") {
    return classifyRisk(raw.risk_score);
  }
  return "medium";
}

export async function analyzeWithOpenAI(text: string, market: string): Promise<PreviewAnalysisResponse | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const model = process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini";

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Market: ${market}\n\nContract text:\n"""\n${text.slice(0, 18000)}\n"""`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as RawAnalysis;

    const score = typeof parsed.risk_score === "number" ? Math.max(0, Math.min(100, parsed.risk_score)) : 0;
    const factors = coerceFactors(parsed.factors);

    return {
      contract_type: parsed.contract_type || "general contract",
      summary: parsed.summary || "Cheka analysed the document and produced a structured summary.",
      key_points: coerceArray(parsed.key_points).slice(0, 5),
      red_flags: coerceArray(parsed.red_flags),
      risk_score: score,
      risk_level: normalizeRiskLevel(parsed),
      factors,
      financial_obligations: coerceArray(parsed.financial_obligations).slice(0, 5),
      duration_terms: coerceArray(parsed.duration_terms).slice(0, 5),
      cancellation_terms: coerceArray(parsed.cancellation_terms).slice(0, 5),
      recommended_actions: coerceArray(parsed.recommended_actions).slice(0, 5),
    };
  } catch (error) {
    console.error("[openai] analysis failed", error);
    return null;
  }
}

export async function followUpWithOpenAI(
  analysis: PreviewAnalysisResponse,
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<{ answer: string; suggested_next_step: string | null } | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const model = process.env.OPENAI_FOLLOW_UP_MODEL || "gpt-4o-mini";

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: FOLLOW_UP_SYSTEM_PROMPT },
        {
          role: "system",
          content: `Analysis context:\n${JSON.stringify(analysis).slice(0, 6000)}`,
        },
        ...history.slice(-6),
        { role: "user", content: question },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { answer?: string; suggested_next_step?: string | null };
    if (!parsed.answer) return null;

    return {
      answer: parsed.answer,
      suggested_next_step: parsed.suggested_next_step ?? null,
    };
  } catch (error) {
    console.error("[openai] follow-up failed", error);
    return null;
  }
}

export async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are an OCR engine. Return the full text content of the image verbatim. Preserve paragraph breaks. Do not summarise or comment.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all text from this contract image." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error("[openai] vision extraction failed", error);
    return null;
  }
}
