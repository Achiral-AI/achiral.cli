import React from 'react'
import { Box, Text } from 'ink'
import type { CLIMessage } from '../api/types.js'
import { COLORS } from './theme.js'

// Show last N messages so the screen doesn't overflow
const MAX_VISIBLE = 20

type Props = {
  messages: CLIMessage[]
  loading: boolean
}

export default function Messages({ messages, loading }: Props) {
  const visible = messages.slice(-MAX_VISIBLE)

  return (
    <Box flexDirection="column" paddingX={1}>
      {visible.length === 0 && !loading && (
        <Box marginY={1}>
          <Text color="gray" dimColor>Type a message to get started.</Text>
        </Box>
      )}

      {visible.map(msg => (
        <MessageRow key={msg.id} message={msg} />
      ))}

      {loading && (
        <Box marginTop={1}>
          <Text color={COLORS.accent}>● </Text>
          <Text color="gray" dimColor>Thinking…</Text>
        </Box>
      )}
    </Box>
  )
}

function MessageRow({ message }: { message: CLIMessage }) {
  switch (message.role) {
    case 'user':
      return (
        <Box flexDirection="column" marginTop={1}>
          <Text color={COLORS.user} bold>you</Text>
          <Text wrap="wrap">{message.content}</Text>
        </Box>
      )

    case 'assistant':
      return (
        <Box flexDirection="column" marginTop={1}>
          <Text color={COLORS.assistant} bold>achiral</Text>
          <Text wrap="wrap">{message.content}</Text>
        </Box>
      )

    case 'system':
      return (
        <Box marginTop={1}>
          <Text color="gray" dimColor>─ {message.content} ─</Text>
        </Box>
      )

    case 'error':
      return (
        <Box marginTop={1}>
          <Text color={COLORS.error}>✗ {message.content}</Text>
        </Box>
      )

    default:
      return null
  }
}
