import { NextResponse } from "next/server";

import { extractDocument } from "../../lib/document-extract";
import { analyzeWithOpenAI, isOpenAIEnabled } from "../../lib/openai-client";
import { buildRuleAnalysis } from "../../lib/risk-engine";
import type { InputType, Market } from "../../lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzePayload {
  text?: string;
  market?: Market;
  source_name?: string;
  input_type?: InputType;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  let text = "";
  let market: Market = "south_africa";
  let sourceName: string | undefined;
  let inputType: InputType = "pdf";
  let extractionEngine: "client" | "pdf-parse" | "mammoth" | "openai-vision" | "url-fetch" = "client";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const marketField = formData.get("market");
      const sourceField = formData.get("source_name");
      const fallbackText = formData.get("text");

      if (marketField === "kenya" || marketField === "south_africa") market = marketField;
      if (typeof sourceField === "string" && sourceField.trim()) sourceName = sourceField.trim();

      if (file instanceof File) {
        sourceName = sourceName || file.name;
        const buffer = Buffer.from(await file.arrayBuffer());
        const extracted = await extractDocument({ buffer, name: file.name, type: file.type });
        text = extracted.text;
        inputType = extracted.inputType;
        extractionEngine =
          inputType === "pdf" ? "pdf-parse" : inputType === "docx" ? "mammoth" : "openai-vision";
      } else if (typeof fallbackText === "string") {
        text = fallbackText;
      }
    } else {
      const body = (await request.json()) as AnalyzePayload & { url?: string };
      if (body.market === "kenya" || body.market === "south_africa") market = body.market;
      sourceName = body.source_name;

      if (body.input_type) inputType = body.input_type;

      if (body.url) {
        try {
          const fetched = await fetch(body.url, { redirect: "follow" });
          if (!fetched.ok) throw new Error(`URL returned ${fetched.status}`);
          text = await fetched.text();
          extractionEngine = "url-fetch";
          inputType = "url";
        } catch (urlError) {
          return jsonError(
            urlError instanceof Error ? `Failed to fetch URL: ${urlError.message}` : "Failed to fetch URL",
            400,
          );
        }
      } else if (typeof body.text === "string") {
        text = body.text;
      }
    }
  } catch (parseError) {
    return jsonError(parseError instanceof Error ? parseError.message : "Invalid request body", 400);
  }

  const cleanText = text.replace(/\s+/g, " ").trim();
  if (cleanText.length < 40) {
    return jsonError(
      "We could not extract enough text from the document. Try a clearer file or paste the contract text.",
      422,
    );
  }

  const ruleAnalysis = buildRuleAnalysis(cleanText);
  let aiUsed = false;
  let analysis = ruleAnalysis;

  if (isOpenAIEnabled()) {
    const aiAnalysis = await analyzeWithOpenAI(cleanText, market);
    if (aiAnalysis) {
      analysis = aiAnalysis;
      aiUsed = true;
    }
  }

  return NextResponse.json({
    analysis,
    text: cleanText,
    market,
    source_name: sourceName,
    input_type: inputType,
    engine: aiUsed ? "openai" : "rules",
    extraction: extractionEngine,
  });
}
