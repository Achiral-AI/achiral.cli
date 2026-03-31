import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const SESSIONS_DIR = join(homedir(), '.achiral', 'sessions')

type SessionData = {
  workspace: string
  assistantId: string
  conversationId: string
  updatedAt: string
}

function sessionKey(workspace: string, assistantId: string): string {
  return `${workspace}__${assistantId}.json`
}

export async function saveSession(data: Omit<SessionData, 'updatedAt'>): Promise<void> {
  try {
    await mkdir(SESSIONS_DIR, { recursive: true })
    const file = join(SESSIONS_DIR, sessionKey(data.workspace, data.assistantId))
    await writeFile(file, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2), 'utf-8')
  } catch {
    // Non-fatal — session persistence is best-effort
  }
}

export async function loadLastSession(
  workspace: string,
  assistantId: string,
): Promise<SessionData | null> {
  try {
    const file = join(SESSIONS_DIR, sessionKey(workspace, assistantId))
    const raw = await readFile(file, 'utf-8')
    return JSON.parse(raw) as SessionData
  } catch {
    return null
  }
}

export async function clearSession(workspace: string, assistantId: string): Promise<void> {
  try {
    const { unlink } = await import('fs/promises')
    await unlink(join(SESSIONS_DIR, sessionKey(workspace, assistantId)))
  } catch {
    // already gone
  }
}
