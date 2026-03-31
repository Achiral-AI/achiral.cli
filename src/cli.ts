import { Command } from '@commander-js/extra-typings'
import chalk from 'chalk'
import { getConfig, resolveConfig, saveConfig } from './utils/config.js'
import { getCredentials, clearCredentials } from './auth/credentials.js'
import { loginCommand } from './auth/login.js'
import { AchiralClient } from './api/client.js'
import { startREPL } from './ui/REPL.js'

export async function main(): Promise<void> {
  const program = new Command()
    .name('achiral')
    .description('Developer CLI for Achiral – AI-powered development with your organisation\'s model engine')
    .version('0.1.0')
    .helpOption('-h, --help', 'Show help')

  // ── Default action: open interactive REPL ──────────────────────────────────
  program
    .argument('[prompt]', 'Optional prompt to send immediately (opens REPL after response)')
    .option('-w, --workspace <slug>', 'Workspace slug (e.g. mycompany)')
    .option('-a, --assistant <id>', 'Assistant ID to use (overrides saved default)')
    .option('-p, --print', 'Non-interactive: print response and exit (like pipe mode)')
    .option('--dev', 'Use http:// instead of https:// for local development')
    .action(async (prompt, options) => {
      const creds = await getCredentials()
      if (!creds) {
        console.error(chalk.red('\n  Not logged in. Run `achiral login` first.\n'))
        process.exit(1)
      }

      const config = await resolveConfig({
        workspace: options.workspace ?? creds.workspace,
        token: creds.token,
        assistantId: options.assistant,
        dev: options.dev,
      })

      if (options.print && prompt) {
        await runHeadless(config, prompt)
      } else {
        await startREPL(config, prompt)
      }
    })

  // ── login ──────────────────────────────────────────────────────────────────
  program.addCommand(loginCommand())

  // ── logout ─────────────────────────────────────────────────────────────────
  program.command('logout')
    .description('Remove saved credentials')
    .action(async () => {
      await clearCredentials()
      console.log(chalk.green('  Logged out.\n'))
    })

  // ── whoami ─────────────────────────────────────────────────────────────────
  program.command('whoami')
    .description('Show current workspace and active assistant')
    .action(async () => {
      const creds = await getCredentials()
      if (!creds) {
        console.log(chalk.dim('  Not logged in.\n'))
        return
      }
      const config = await getConfig()
      console.log(`\n  Workspace : ${chalk.cyan(creds.workspace + '.achiral.ai')}`)
      if (config.defaultAssistantId) {
        console.log(`  Assistant : ${chalk.green(config.defaultAssistantId)}`)
      }
      console.log()
    })

  // ── list ───────────────────────────────────────────────────────────────────
  program.command('list')
    .alias('ls')
    .description('List available assistants in your workspace')
    .action(async () => {
      const creds = await getCredentials()
      if (!creds) {
        console.error(chalk.red('\n  Not logged in. Run `achiral login` first.\n'))
        process.exit(1)
      }

      const config = await getConfig()
      const client = new AchiralClient(creds.workspace, creds.token)

      try {
        const { assistants } = await client.get<{
          assistants: Array<{ _id: string; name: string; type: string; status: string; baseModel: string }>
        }>('/api/assistants')

        if (assistants.length === 0) {
          console.log(chalk.dim('\n  No assistants found.\n'))
          return
        }

        console.log(`\n  Assistants in ${chalk.cyan(creds.workspace + '.achiral.ai')}:\n`)
        for (const a of assistants) {
          const isDefault = a._id === config.defaultAssistantId
          const marker = isDefault ? chalk.green('●') : chalk.dim('○')
          console.log(`  ${marker} ${chalk.white(a.name)} ${chalk.dim(`(${a._id})`)}`)
          console.log(`       ${chalk.dim(`type: ${a.type}  model: ${a.baseModel}  status: ${a.status}`)}`)
        }
        console.log()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(chalk.red(`\n  Failed to list assistants: ${msg}\n`))
        process.exit(1)
      }
    })

  // ── use ────────────────────────────────────────────────────────────────────
  program.command('use')
    .description('Set the default assistant for this workspace')
    .argument('<assistant-id>', 'Assistant ID to set as default')
    .action(async (assistantId) => {
      await saveConfig({ defaultAssistantId: assistantId })
      console.log(chalk.green(`\n  Default assistant set to ${assistantId}\n`))
    })

  await program.parseAsync()
}

// ── Headless / pipe mode ─────────────────────────────────────────────────────
async function runHeadless(config: Awaited<ReturnType<typeof resolveConfig>>, prompt: string): Promise<void> {
  const client = new AchiralClient(config.workspace, config.token, config.dev)

  try {
    const response = await client.post<{ success: boolean; message: string; conversationId: string }>(
      `/api/assistants/${config.assistantId}/chat`,
      { message: prompt }
    )
    process.stdout.write(response.message + '\n')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`Error: ${msg}\n`)
    process.exit(1)
  }
}
