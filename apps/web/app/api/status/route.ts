import { NextResponse } from "next/server";

import { isOpenAIEnabled } from "../../lib/openai-client";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    openai_enabled: isOpenAIEnabled(),
    external_api: Boolean(process.env.NEXT_PUBLIC_CHEKA_API_URL),
    analysis_model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini",
  });
}
