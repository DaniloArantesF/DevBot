import { MessagePayload, MessageCreateOptions } from 'discord.js';
import { getGuildChannel } from './channels';

export async function sendMessage(
  channelId: string,
  message: string | MessagePayload | MessageCreateOptions,
) {
  const channel = await getGuildChannel(channelId);
  if (!channel || !channel.isTextBased()) return new Error('Invalid channel!');
  return channel.send(message);
}

export const getUserMention = (userId: string) => `<@${userId}>`;
export const getRoleMention = (roleId: string) => `<@&${roleId}>`;
