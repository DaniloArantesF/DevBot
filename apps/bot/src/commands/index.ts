import fs from 'fs';
import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

// Make some properties optional
type CommandData = Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> & Partial<SlashCommandBuilder>;

export interface Command {
  aliases?: string[];
  args?: boolean;
  data: CommandData;
  execute: (interaction: CommandInteraction) => Promise<void>;
  permissions?: string[];
  usage?: string;
}

export function getCommands() {
  const commands: Command[] = [];
  const commandFiles = fs
    .readdirSync(process.env.NODE_ENV === 'prod' ? 'dist/commands' : 'src/commands/')
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of commandFiles) {
    if (file === 'index.ts') continue;
    const command = require(`./${file}`).command;
    if (!command?.data) continue; // Ignore empty files
    commands.push(command);
  }

  return commands;
}
