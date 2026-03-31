// Mirrors relevant fields from Achiral's Assistant and Chat models

export type AssistantSummary = {
  _id: string
  name: string
  displayName?: string
  slug: string
  type: 'org_shared' | 'employee_personal'
  status: 'provisioning' | 'active' | 'paused' | 'failed'
  baseModel: string
  description?: string
  role?: string
}

// Response shape from POST /api/assistants/:id/chat
export type ChatResponse = {
  success: boolean
  message: string          // AI response text
  conversationId: string   // persisted conversation ID for follow-up turns
  userMessageId?: string
  aiMessageId?: string
  metadata?: {
    assistantId: string
    tokensUsed?: number
    responseTime?: number
  }
}

export type ConversationSummary = {
  _id: string
  title: string
  lastMessage: string
  lastMessageAt: string
  messageCount: number
  status: 'active' | 'archived' | 'resolved' | 'closed'
}

// Internal CLI message type (not from the API)
export type CLIMessage = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'error'
  content: string
  timestamp: Date
}
