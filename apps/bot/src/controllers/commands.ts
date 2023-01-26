import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { TOKEN, CLIENT_ID } from '@config';
import { DiscordCommand } from '@utils/types';
import fs from 'fs';

export async function getCommands(all = false) {
  const commands: DiscordCommand[] = [];
  const commandFiles = fs
    .readdirSync(process.env.NODE_ENV === 'prod' ? 'dist/commands' : 'src/commands/')
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of commandFiles) {
    if (file === 'index.ts') continue;
    const command = await import(`@commands/${file}`);
    const slashCommand = command.command;
    const contextCommand = command.contextCommand;

    if (all && contextCommand) commands.push(contextCommand);
    if (!slashCommand || !slashCommand.data) continue;

    commands.push(slashCommand);
  }

  return commands;
}

/**
 * Registers slash commands globally or for a specific guild
 * @throws {DiscordAPIError}
 */
export async function setSlashCommands(commands: DiscordCommand[], guildId?: string) {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const endpoint = guildId
    ? Routes.applicationGuildCommands(CLIENT_ID, guildId.toString())
    : Routes.applicationCommands(CLIENT_ID);
  return await rest.put(endpoint, {
    body: commands.map((command) => {
      const isSlashCommand = Boolean(command.data);
      if (isSlashCommand) {
        return command.data.toJSON();
      }
      return (command as any).toJSON();
    }),
  });
}

export async function registerGlobalSlashCommands() {
  let commands = await getCommands(true);
  return await setSlashCommands(commands);
}

export async function registerGuildSlashCommands(guildId: string) {
  let commands = await getCommands(true);
  return await setSlashCommands(commands, guildId);
}

export async function deleteGlobalSlashCommands() {
  return await setSlashCommands([]);
}

export async function deleteGuildSlashCommands(guildId: string) {
  return await setSlashCommands([], guildId);
}
