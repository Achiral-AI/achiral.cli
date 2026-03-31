import React, { useState, useCallback, useEffect, useRef } from 'react'
import { render, Box, Text, useApp } from 'ink'
import type { CLIMessage } from '../api/types.js'
import type { ResolvedConfig } from '../utils/config.js'
import { AchiralClient } from '../api/client.js'
import { chat } from '../api/assistant.js'
import { saveSession, loadLastSession } from '../utils/session.js'
import Messages from './Messages.js'
import PromptInput from './PromptInput.js'
import { COLORS } from './theme.js'

type Props = {
  config: ResolvedConfig
  initialPrompt?: string
}

function REPL({ config, initialPrompt }: Props) {
  const { exit } = useApp()
  const [messages, setMessages] = useState<CLIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const clientRef = useRef(new AchiralClient(config.workspace, config.token, config.dev))

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addMessage = useCallback((role: CLIMessage['role'], content: string) => {
    const msg: CLIMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  // ── Send ───────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return
      setErrorMsg(null)
      addMessage('user', text)
      setLoading(true)

      try {
        const response = await chat(clientRef.current, config.assistantId, text, conversationId)
        setConversationId(response.conversationId)
        addMessage('assistant', response.message)

        // Persist session so the conversation can be referenced later
        await saveSession({
          workspace: config.workspace,
          assistantId: config.assistantId,
          conversationId: response.conversationId,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMsg(msg)
      } finally {
        setLoading(false)
      }
    },
    [loading, conversationId, config, addMessage],
  )

  // ── Restore last conversation on mount ────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const last = await loadLastSession(config.workspace, config.assistantId)
      if (last?.conversationId) {
        setConversationId(last.conversationId)
        addMessage('system', `Resuming conversation ${last.conversationId.slice(-8)}`)
      }

      if (initialPrompt) {
        await sendMessage(initialPrompt)
      }
    }
    void init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box flexDirection="column">
      {/* Header bar */}
      <Box paddingX={1} marginBottom={1}>
        <Text color={COLORS.brand} bold>achiral</Text>
        <Text color="gray"> / </Text>
        <Text color="white">{config.workspace}</Text>
        {config.assistantName && (
          <>
            <Text color="gray"> · </Text>
            <Text color={COLORS.success}>{config.assistantName}</Text>
          </>
        )}
        {conversationId && (
          <>
            <Text color="gray"> · </Text>
            <Text color="gray">#{conversationId.slice(-8)}</Text>
          </>
        )}
        <Text color="gray">{'  ctrl+c to exit'}</Text>
      </Box>

      {/* Message history */}
      <Messages messages={messages} loading={loading} />

      {/* Error notice */}
      {errorMsg && (
        <Box marginX={1} marginTop={1}>
          <Text color={COLORS.error}>⚠ {errorMsg}</Text>
        </Box>
      )}

      {/* Prompt input */}
      <PromptInput
        onSubmit={sendMessage}
        onExit={() => exit()}
        disabled={loading}
      />
    </Box>
  )
}

// ── Public entrypoint ──────────────────────────────────────────────────────

export async function startREPL(config: ResolvedConfig, initialPrompt?: string): Promise<void> {
  const { waitUntilExit } = render(<REPL config={config} initialPrompt={initialPrompt} />)
  await waitUntilExit()
}
