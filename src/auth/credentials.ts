import { readFile, writeFile, mkdir, chmod, unlink } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const ACHIRAL_DIR = join(homedir(), '.achiral')
const CREDS_FILE = join(ACHIRAL_DIR, 'credentials.json')

export type Credentials = {
  workspace: string // org slug, e.g. "mycompany"
  token: string     // API token
  email?: string    // optional, stored for display only
}

export async function getCredentials(): Promise<Credentials | null> {
  try {
    const raw = await readFile(CREDS_FILE, 'utf-8')
    return JSON.parse(raw) as Credentials
  } catch {
    return null
  }
}

export async function saveCredentials(creds: Credentials): Promise<void> {
  await mkdir(ACHIRAL_DIR, { recursive: true })
  await writeFile(CREDS_FILE, JSON.stringify(creds, null, 2), 'utf-8')
  // Restrict to owner-read/write only — tokens should not be world-readable
  await chmod(CREDS_FILE, 0o600)
}

export async function clearCredentials(): Promise<void> {
  try {
    await unlink(CREDS_FILE)
  } catch {
    // already gone
  }
}
