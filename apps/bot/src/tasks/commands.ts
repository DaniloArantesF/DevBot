import {
  Message,
  MessageReplyOptions,
  MessagePayload,
  CommandInteraction as _CommandInteraction,
  InteractionReplyOptions,
} from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { TOKEN, CLIENT_ID } from '@config';
import { TBot } from '@utils/types';
import fs from 'fs';
import { CommandInteraction } from '@/controllers/commandController';

export async function getCommands(all = false) {
  const commands: TBot.Command[] = [];
  const commandFiles = fs
    .readdirSync(process.env.NODE_ENV === 'prod' ? 'dist/commands' : 'src/commands/')
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of commandFiles) {
    if (file === 'index.ts') continue;
    const exports = await import(`@commands/${file}`);

    for (const commandName in exports) {
      const command = exports[commandName];
      if (command.execute === undefined && !all) continue;
      commands.push(command);
    }
  }

  return commands;
}

/**
 * Registers slash commands globally or for a specific guild
 * @throws {DiscordAPIError}
 */
export async function setSlashCommands(commands: TBot.Command[], guildId?: string) {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const endpoint = guildId
    ? Routes.applicationGuildCommands(CLIENT_ID, guildId.toString())
    : Routes.applicationCommands(CLIENT_ID);
  return await rest.put(endpoint, {
    body: commands
      .filter((c) => c.data?.toJSON !== undefined || (c as any)?.toJSON !== undefined)
      .map((command) => {
        const isSlashCommand = Boolean(command.data);
        if (isSlashCommand) {
          return command.data.toJSON();
        }
        return (command as any)?.toJSON();
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

export function replyInteraction(
  interaction: CommandInteraction | _CommandInteraction,
  reply: string | (MessagePayload | MessageReplyOptions) | InteractionReplyOptions,
) {
  if (interaction instanceof Message) {
    return interaction.reply(reply as string | MessagePayload | MessageReplyOptions);
  } else {
    return interaction.deferred
      ? interaction.editReply(reply)
      : interaction.reply(reply as string | InteractionReplyOptions);
  }
}
