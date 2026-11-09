import type { PageDocument } from "@visual-builder/document-schema";

const apiRoot = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api").replace(/\/$/, "");

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
  const data = new FormData();
  data.append("file", file);
  const response = await fetch(`${apiRoot}/assets/upload`, { method: "POST", body: data });
  const result = await response.json() as { url?: string; message?: string };
  if (!response.ok || !result.url) throw new Error(result.message ?? `Image upload failed (${response.status}).`);
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
