#!/usr/bin/env node
import { program } from 'commander'
import { initCommand } from './commands/init'
import { addCommand } from './commands/add'

program
  .name('nextstack')
  .description('CLI for @nextstack package setup and migrations')
  .version('0.1.0')

program
  .command('init')
  .description('Initialize @nextstack in your project')
  .action(initCommand)

program
  .command('add <package>')
  .description('Add a @nextstack package to your project')
  .action(addCommand)

program.parse()
