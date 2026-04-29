import mammoth from "mammoth";

import { extractTextFromImage } from "./openai-client";
import type { InputType } from "./types";

export interface ExtractedDocument {
  text: string;
  inputType: InputType;
  detectedFromMime: string | null;
}

export function detectInputTypeFromName(name: string, mime: string): InputType {
  const lower = name.toLowerCase();
  const m = mime.toLowerCase();
  if (m.includes("pdf") || lower.endsWith(".pdf")) return "pdf";
  if (m.includes("word") || lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  if (m.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif)$/.test(lower)) return "image";
  return "pdf";
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const pageTexts = result.pages?.map((page) => page.text).filter(Boolean) ?? [];
    return (result.text || pageTexts.join("\n\n") || "").trim();
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

export async function extractDocument(
  file: { buffer: Buffer; name: string; type: string },
): Promise<ExtractedDocument> {
  const inputType = detectInputTypeFromName(file.name, file.type);

  if (inputType === "pdf") {
    const text = await extractPdf(file.buffer);
    return { text, inputType, detectedFromMime: file.type || null };
  }

  if (inputType === "docx") {
    const text = await extractDocx(file.buffer);
    return { text, inputType, detectedFromMime: file.type || null };
  }

  if (inputType === "image") {
    const text = (await extractTextFromImage(file.buffer, file.type || "image/png")) ?? "";
    return { text, inputType, detectedFromMime: file.type || null };
  }

  return { text: file.buffer.toString("utf8"), inputType: "pdf", detectedFromMime: file.type || null };
}
