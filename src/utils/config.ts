import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { AchiralClient } from '../api/client.js'
import { listAssistants, getAssistant } from '../api/assistant.js'

const ACHIRAL_DIR = join(homedir(), '.achiral')
const CONFIG_FILE = join(ACHIRAL_DIR, 'config.json')

// Persisted preferences (non-sensitive — tokens go in credentials.json)
type PersistedConfig = {
  defaultAssistantId?: string
}

// Fully-resolved config passed into the REPL and API calls
export type ResolvedConfig = {
  workspace: string
  token: string
  assistantId: string
  assistantName?: string
  dev?: boolean
}

// ── Read / write ────────────────────────────────────────────────────────────

export async function getConfig(): Promise<PersistedConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(raw) as PersistedConfig
  } catch {
    return {}
  }
}

export async function saveConfig(updates: Partial<PersistedConfig>): Promise<void> {
  await mkdir(ACHIRAL_DIR, { recursive: true })
  const existing = await getConfig()
  await writeFile(CONFIG_FILE, JSON.stringify({ ...existing, ...updates }, null, 2), 'utf-8')
}

// ── Resolve ─────────────────────────────────────────────────────────────────

type ResolveInput = {
  workspace: string
  token: string
  assistantId?: string      // explicit override from CLI flag
  dev?: boolean
}

/**
 * Build a complete ResolvedConfig, fetching the default assistant from the API
 * if no assistantId was provided via CLI or saved config.
 */
export async function resolveConfig(input: ResolveInput): Promise<ResolvedConfig> {
  const saved = await getConfig()
  const client = new AchiralClient(input.workspace, input.token, input.dev)

  let assistantId = input.assistantId ?? saved.defaultAssistantId
  let assistantName: string | undefined

  if (!assistantId) {
    // Auto-pick the first active assistant
    const assistants = await listAssistants(client)
    const active = assistants.find(a => a.status === 'active') ?? assistants[0]
    if (!active) {
      throw new Error(
        `No active assistants found in workspace "${input.workspace}". ` +
        'Create one at your Achiral dashboard first.',
      )
    }
    assistantId = active._id
    assistantName = active.displayName ?? active.name
    // Persist for next time
    await saveConfig({ defaultAssistantId: assistantId })
  } else {
    // Fetch name for display in the REPL header
    try {
      const assistant = await getAssistant(client, assistantId)
      assistantName = assistant.displayName ?? assistant.name
    } catch {
      // Not fatal — we just won't show the name
    }
  }

  return {
    workspace: input.workspace,
    token: input.token,
    assistantId,
    assistantName,
    dev: input.dev,
  }
}
