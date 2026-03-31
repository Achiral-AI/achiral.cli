#!/usr/bin/env node
import { main } from './cli.js'

main().catch(err => {
  process.stderr.write(`\nError: ${err.message}\n`)
  process.exit(1)
})
