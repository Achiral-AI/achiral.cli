import { AchiralClient } from './client.js'
import type { AssistantSummary, ChatResponse, ConversationSummary } from './types.js'

// ── Assistant operations ───────────────────────────────────────────────────

export async function listAssistants(client: AchiralClient): Promise<AssistantSummary[]> {
  const res = await client.get<{ success: boolean; assistants: AssistantSummary[] }>('/api/assistants')
  return res.assistants
}

export async function getAssistant(client: AchiralClient, assistantId: string): Promise<AssistantSummary> {
  const res = await client.get<{ success: boolean; assistant: AssistantSummary }>(`/api/assistants/${assistantId}`)
  return res.assistant
}

// ── Chat ──────────────────────────────────────────────────────────────────

export async function chat(
  client: AchiralClient,
  assistantId: string,
  message: string,
  conversationId?: string | null,
): Promise<ChatResponse> {
  return client.post<ChatResponse>(`/api/assistants/${assistantId}/chat`, {
    message,
    conversationId: conversationId ?? undefined,
  })
}

// ── Conversation history ──────────────────────────────────────────────────

export async function listConversations(
  client: AchiralClient,
  assistantId: string,
  limit = 20,
): Promise<ConversationSummary[]> {
  const res = await client.get<{ success: boolean; conversations: ConversationSummary[] }>(
    `/api/assistants/${assistantId}/conversations?limit=${limit}`,
  )
  return res.conversations
}
