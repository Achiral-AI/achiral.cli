import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { COLORS } from './theme.js'

type Props = {
  onSubmit: (text: string) => void
  onExit: () => void
  disabled: boolean
}

export default function PromptInput({ onSubmit, onExit, disabled }: Props) {
  const [input, setInput] = useState('')

  useInput((ch, key) => {
    // ctrl+c always exits
    if (key.ctrl && ch === 'c') {
      onExit()
      return
    }

    if (disabled) return

    if (key.return) {
      const text = input.trim()
      if (text) {
        setInput('')
        onSubmit(text)
      }
      return
    }

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1))
      return
    }

    // Ignore control sequences we don't handle
    if (key.ctrl || key.meta || key.escape) return

    if (ch) {
      setInput(prev => prev + ch)
    }
  })

  const borderColor = disabled ? 'gray' : COLORS.brand

  return (
    <Box borderStyle="single" borderColor={borderColor} paddingX={1} marginTop={1}>
      <Text color={COLORS.brand} bold>{'> '}</Text>
      <Text>{input}</Text>
      {!disabled && <Text color={COLORS.brand} bold>▋</Text>}
    </Box>
  )
}
