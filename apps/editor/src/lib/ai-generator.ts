import { pageDocumentSchema } from "@visual-builder/document-schema";
import { pageToLayers, type EditorLayer } from "./page-model";

export type GeneratedItem = EditorLayer;

export type GenerationResult = {
  items: GeneratedItem[];
  mode: "endpoint";
};

export async function generatePageFromPrompt(
  prompt: string,
): Promise<GenerationResult> {
  const apiRoot = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api").replace(/\/$/, "");
  const endpoint = import.meta.env.VITE_AI_GENERATION_ENDPOINT?.trim() || `${apiRoot}/ai/generate`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "message" in payload
      ? payload.message
      : undefined;
    throw new Error(typeof message === "string" ? message : `AI endpoint returned ${response.status}.`);
  }
  const candidate =
    typeof payload === "object" && payload !== null && "document" in payload
      ? payload.document
      : payload;
  const document = pageDocumentSchema.parse(candidate);
  return { items: pageToLayers(document), mode: "endpoint" };
}
