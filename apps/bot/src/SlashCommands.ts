import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Command, getCommands } from '@commands/index';
import { TOKEN, CLIENT_ID } from '@config';

export async function setSlashCommands(commands: Command[], guildId?: string) {
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const endpoint = guildId
      ? Routes.applicationGuildCommands(CLIENT_ID, guildId.toString())
      : Routes.applicationCommands(CLIENT_ID);
    return await rest.put(endpoint, {
      body: commands.map((command) => command.data.toJSON()),
    });
  } catch (error) {
    console.error(error);
    return {};
  }
}

export async function registerGlobalSlashCommands() {
  let commands = getCommands();
  return await setSlashCommands(commands);
}

export async function registerGuildSlashCommands(guildId: string) {
  let commands = getCommands();
  return await setSlashCommands(commands, guildId);
}

export async function deleteGlobalSlashCommands() {
  return await setSlashCommands([]);
}

export async function deleteGuildSlashCommands(guildId: string) {
  return await setSlashCommands([], guildId);
}
