import { NextResponse } from "next/server";

import { followUpWithOpenAI, isOpenAIEnabled } from "../../lib/openai-client";
import { buildRuleFollowUpAnswer } from "../../lib/risk-engine";
import type { ConversationMessage, PreviewAnalysisResponse } from "../../lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface FollowUpRequest {
  question?: string;
  analysis?: PreviewAnalysisResponse;
  history?: ConversationMessage[];
}

export async function POST(request: Request) {
  let body: FollowUpRequest;
  try {
    body = (await request.json()) as FollowUpRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = body.question?.trim();
  const analysis = body.analysis;
  if (!question) return NextResponse.json({ error: "Question is required" }, { status: 400 });
  if (!analysis) return NextResponse.json({ error: "Analysis context is required" }, { status: 400 });

  const history = (body.history || []).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  if (isOpenAIEnabled()) {
    const ai = await followUpWithOpenAI(analysis, question, history);
    if (ai) {
      return NextResponse.json({ ...ai, engine: "openai" });
    }
  }

  const fallback = buildRuleFollowUpAnswer(analysis, question);
  return NextResponse.json({ ...fallback, engine: "rules" });
}
