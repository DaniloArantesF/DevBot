import { MessagePayload, MessageCreateOptions, TextChannel, Role } from 'discord.js';
import { getGuildChannel } from './channels';
import { TPocketbase } from 'shared/types';

export async function sendMessage(
  channelId: string,
  message: string | MessagePayload | MessageCreateOptions,
) {
  const channel = (await getGuildChannel(channelId)) as TextChannel;
  if (!channel || !channel.isTextBased()) return new Error('Invalid channel!');
  return channel.send(message);
}

export const getLatestChannelMessages = async (channel: TextChannel, limit = 10) => {
  const messages = [...channel.messages.cache.values()];
  messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  return messages.slice(-limit);
};

export const getUserMention = (userId: string) => `<@${userId}>`;
export const getRoleMention = (roleId: string) => `<@&${roleId}>`;

export const getRolesMessage = (userRoles: { emoji: string; id: string }[]) => {
  let message = 'React to the emojis to set/unset your roles:\n';
  for (const role of userRoles) {
    message += `${role.emoji} - ${getRoleMention(role.id)}\n`;
  }
  return message;
};
