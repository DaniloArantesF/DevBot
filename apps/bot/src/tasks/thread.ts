import { TextChannel, ChannelType, GuildTextThreadCreateOptions } from 'discord.js';
import { getGuildChannel } from './channels';

export async function createThread(
  guildId: string,
  channelId: string,
  options: GuildTextThreadCreateOptions<ChannelType.PublicThread>,
) {
  const channel = (await getGuildChannel(guildId, channelId)) as TextChannel;
  const thread = await channel.threads.create(options);
  return thread;
}

// TODO
export async function lockThread(guildId: string, threadId: string) {}
