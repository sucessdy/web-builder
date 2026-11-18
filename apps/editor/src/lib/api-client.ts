import type { PageDocument } from "@visual-builder/document-schema";

const apiRoot = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api").replace(/\/$/, "");
export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const IMAGE_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
const supportedImageTypes = new Set(IMAGE_UPLOAD_ACCEPT.split(","));

export type StoredPage = { id: string; name: string; document: unknown; updatedAt?: string };

export async function listRemotePages(workspaceId: string): Promise<StoredPage[]> {
  const response = await fetch(`${apiRoot}/pages`, { headers: { "X-Workspace-Id": workspaceId } });
  if (!response.ok) throw new Error(`Page service returned ${response.status}.`);
  return await response.json() as StoredPage[];
}

export async function saveRemotePage(workspaceId: string, page: { id: string; name: string; document: PageDocument }): Promise<void> {
  const response = await fetch(`${apiRoot}/pages/${encodeURIComponent(page.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId },
    body: JSON.stringify({ name: page.name, document: page.document }),
  });
  if (!response.ok) throw new Error(`Page service returned ${response.status}.`);
}

export async function deleteRemotePage(workspaceId: string, pageId: string): Promise<void> {
  const response = await fetch(`${apiRoot}/pages/${encodeURIComponent(pageId)}`, {
    method: "DELETE",
    headers: { "X-Workspace-Id": workspaceId },
  });
  if (!response.ok && response.status !== 404) throw new Error(`Page service returned ${response.status}.`);
}

export async function uploadImage(file: File): Promise<string> {
  if (!supportedImageTypes.has(file.type)) {
    throw new Error("Choose a PNG, JPEG, WebP, GIF, or SVG image.");
  }
  if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const data = new FormData();
  data.append("file", file);
  let response: Response;
  try {
    response = await fetch(`${apiRoot}/assets/upload`, { method: "POST", body: data });
  } catch {
    throw new Error("Could not connect to the image service. Check that the API server is running.");
  }
  const result = await response.json().catch(() => null) as { url?: string; message?: string | string[] } | null;
  if (!response.ok || !result?.url) {
    const message = Array.isArray(result?.message) ? result.message.join(" ") : result?.message;
    throw new Error(message ?? `Image upload failed (${response.status}).`);
  }
  return result.url;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function sendAiChat(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${apiRoot}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const result = await response.json() as { reply?: string; message?: string };
  if (!response.ok || !result.reply) throw new Error(result.message ?? `AI chat failed (${response.status}).`);
  return result.reply;
}
