import { Command } from '@commander-js/extra-typings'
import { createInterface } from 'readline'
import chalk from 'chalk'
import { saveCredentials } from './credentials.js'
import { AchiralClient } from '../api/client.js'
import { saveConfig } from '../utils/config.js'

// Prompt helpers — readline-based so stdin works correctly outside of Ink
function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function askSecret(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    // Hide input on TTY
    if (process.stdout.isTTY) {
      process.stdout.write(question)
      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.setEncoding('utf-8')
      let buf = ''
      const onData = (ch: string) => {
        if (ch === '\r' || ch === '\n') {
          process.stdout.write('\n')
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.removeListener('data', onData)
          rl.close()
          resolve(buf)
        } else if (ch === '\u0003') {
          process.exit(0)
        } else if (ch === '\u007f') {
          buf = buf.slice(0, -1)
        } else {
          buf += ch
        }
      }
      process.stdin.on('data', onData)
    } else {
      // Non-TTY (piped) — just read normally
      rl.question(question, answer => {
        rl.close()
        resolve(answer.trim())
      })
    }
  })
}

export function loginCommand(): Command {
  return new Command('login')
    .description('Connect to your Achiral workspace')
    .option('-w, --workspace <slug>', 'Workspace slug (e.g. mycompany for mycompany.achiral.ai)')
    .option('-t, --token <token>', 'API token (from your Achiral dashboard → Settings → API Keys)')
    .option('--dev', 'Connect over http:// for local development')
    .action(async options => {
      console.log(chalk.cyan('\n  Achiral CLI — Workspace Login\n'))

      const workspace = options.workspace || (await ask('  Workspace slug : '))
      const token = options.token || (await askSecret('  API token      : '))

      if (!workspace || !token) {
        console.error(chalk.red('\n  Workspace and token are required.\n'))
        process.exit(1)
      }

      process.stdout.write('\n  Connecting...')

      try {
        const client = new AchiralClient(workspace, token, options.dev)
        const { assistants } = await client.get<{
          assistants: Array<{ _id: string; name: string; type: string; status: string }>
        }>('/api/assistants')

        await saveCredentials({ workspace, token })

        // Auto-set the first active assistant as default
        const firstActive = assistants.find(a => a.status === 'active') ?? assistants[0]
        if (firstActive) {
          await saveConfig({ defaultAssistantId: firstActive._id })
        }

        process.stdout.write(chalk.green(' ✓\n'))
        console.log(`\n  Connected to ${chalk.cyan(workspace + '.achiral.ai')}`)
        if (assistants.length > 0) {
          console.log(chalk.dim(`\n  ${assistants.length} assistant(s) available:`))
          assistants.slice(0, 5).forEach(a => {
            const isDefault = a._id === firstActive?._id
            console.log(chalk.dim(`    ${isDefault ? '●' : '○'} ${a.name}`))
          })
        }
        console.log(chalk.dim('\n  Run `achiral` to start chatting.\n'))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        process.stdout.write(chalk.red(' ✗\n'))
        console.error(chalk.red(`\n  Failed to connect: ${msg}`))
        console.error(chalk.dim('  Check your workspace slug and token.\n'))
        process.exit(1)
      }
    })
}
