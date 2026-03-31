# achiral.cli

Developer CLI for [Achiral](https://achiral.ai) — connect to your organisation's AI model engine from the terminal.

Chat with your organisation's shared intelligence (Chiro) or your personal EA directly from the command line. Supports interactive REPL mode, pipe-friendly headless mode, and session persistence across conversations.

---

## Prerequisites

- **Node.js** 20+ or **Bun** 1.0+
- An Achiral account with `developer` or `admin` role
- An API token (generated from your Achiral dashboard)

---

## Installation

### Option 1 — Install from source (recommended while in private beta)

```bash
git clone https://github.com/Achiral-AI/achiral.cli.git
cd achiral.cli
bun install
bun run build
npm link        # makes `achiral` available globally
```

### Option 2 — Run directly with Bun without installing

```bash
git clone https://github.com/Achiral-AI/achiral.cli.git
cd achiral.cli
bun install
bun run src/index.ts   # replaces the `achiral` command
```

---

## Setup

### 1. Generate an API token

1. Sign in to your Achiral dashboard at `https://<your-workspace>.achiral.ai`
2. Go to **Settings → API Keys**
3. Click **Generate new key** — give it a name like `cli-local`
4. Copy the token (it is only shown once)

### 2. Log in

```bash
achiral login
```

You will be prompted for:

```
Workspace slug :  mycompany        # the subdomain before .achiral.ai
API token      :  ach_sk_••••••••
```

Or pass them as flags to skip the prompts:

```bash
achiral login --workspace mycompany --token ach_sk_yourtoken
```

On success, the CLI validates the token against your workspace, lists available assistants, and automatically sets the first active assistant as your default.

Credentials are saved to `~/.achiral/credentials.json` with `600` permissions (owner read/write only).

---

## Connecting to your organisation's Chiro

**Chiro** is your organisation's shared AI assistant. Unlike personal EAs which are assigned to individual team members, Chiro has organisation-wide context — it knows your team structure, company policies, document library, and recent organisational activity.

### Find your Chiro's ID

```bash
achiral list
```

Example output:

```
  Assistants in mycompany.achiral.ai:

  ● Chiro              (68a1b2c3d4e5f6a7b8c9d0e1)
       type: org_shared  model: apertus-8b  status: active

  ○ Alex's EA          (68a1b2c3d4e5f6a7b8c9d0e2)
       type: employee_personal  model: apertus-8b  status: active
```

The `●` marker indicates your current default. The `org_shared` type is Chiro.

### Set Chiro as your default assistant

```bash
achiral use 68a1b2c3d4e5f6a7b8c9d0e1
```

This saves the selection to `~/.achiral/config.json`. All subsequent `achiral` sessions will use Chiro unless overridden.

### Start a session with Chiro

```bash
achiral
```

The REPL header confirms the connected assistant:

```
achiral / mycompany · Chiro  #a7b8c9d0  ctrl+c to exit

Type a message to get started.
> ▋
```

To connect to Chiro for a single session without changing your default:

```bash
achiral --assistant 68a1b2c3d4e5f6a7b8c9d0e1
```

---

## Usage

### Interactive REPL

```bash
achiral                            # open REPL with your default assistant
achiral "summarise today's tasks"  # send an opening message, then stay in REPL
achiral --assistant <id>           # use a specific assistant for this session
achiral --workspace acme           # override the saved workspace
```

**Keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Backspace` | Delete character |
| `Ctrl+C` | Exit |

### Headless / pipe mode

Use `-p` to get a single response and exit — useful for scripts and shell pipelines:

```bash
achiral -p "what is our refund policy?"

# Pipe output to a file
achiral -p "draft release notes for v2.4" > release-notes.md

# Chain with other tools
git diff HEAD~1 | achiral -p "review this diff for security issues"
```

### All commands

```bash
achiral                       # open interactive REPL
achiral login                 # connect to a workspace
achiral logout                # remove saved credentials
achiral whoami                # show current workspace and active assistant
achiral list                  # list all assistants in your workspace
achiral use <assistant-id>    # set your default assistant
```

---

## Local development (connecting to a local Achiral instance)

If you are running Achiral locally, pass `--dev` to use `http://` instead of `https://`:

```bash
achiral login --workspace localhost:3000 --token ach_sk_dev_token --dev
achiral --dev
```

---

## Configuration files

All CLI state is stored under `~/.achiral/`:

| File | Contents |
|------|----------|
| `credentials.json` | Workspace slug and API token (`chmod 600`) |
| `config.json` | Default assistant ID and preferences |
| `sessions/<workspace>__<assistantId>.json` | Last conversation ID per assistant |

To fully reset:

```bash
achiral logout
rm -rf ~/.achiral/config.json ~/.achiral/sessions/
```

---

## Coming soon

**CORTEX** — always-on quality monitor that surfaces assistant drift and response health signals in the REPL header during your session.

**SUBCONSCIOUS** — post-session reflective analysis that reviews recent conversations, identifies gaps in your assistant's business context, and proposes knowledge and persona improvements for your approval.

```bash
achiral subconscious   # coming in next release
```

---

## Troubleshooting

**`Not logged in. Run achiral login first.`**
Run `achiral login` and provide your workspace slug and API token.

**`No active assistants found in workspace`**
Your workspace has no active assistants. Create one at your Achiral dashboard under **Assistants → New**.

**`HTTP 401` or `HTTP 403`**
Your token may have been revoked or expired. Run `achiral login` again with a fresh token.

**`HTTP 404` on the assistant**
The saved default assistant ID may no longer exist. Run `achiral list` and then `achiral use <id>` to pick a new default.

---

## Licence

Proprietary — © Achiral AI. All rights reserved.
