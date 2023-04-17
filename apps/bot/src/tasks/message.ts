import Discord from 'discord.js';
import { getGuildChannel } from './channels';
import { ReactionHandler } from 'shared/types';
import eventController from '@/controllers/eventController';

export async function sendMessage(
  channelId: string,
  message: string | Discord.MessagePayload | Discord.MessageCreateOptions,
) {
  const channel = getGuildChannel(channelId, channelId) as Discord.TextChannel;
  if (!channel || !channel.isTextBased()) return new Error('Invalid channel!');
  return channel.send(message);
}

export const getLatestChannelMessages = async (channel: Discord.TextChannel, limit = 10) => {
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

export function listenMessageReactions(
  message: Discord.Message,
  onAdd: ReactionHandler,
  onRemove: ReactionHandler,
) {
  eventController.eventBus.task(
    Discord.Events.MessageReactionAdd,
    `${message.id}:listenReactions`,
    (reaction: Discord.MessageReaction, user: Discord.User) => {
      if (!(reaction.message.id === message.id && !user.bot)) return;
      onAdd(reaction, user);
    },
  );

  eventController.eventBus.task(
    Discord.Events.MessageReactionRemove,
    `${message.id}:listenReactions`,
    (reaction: Discord.MessageReaction, user: Discord.User) => {
      if (!(reaction.message.id === message.id && !user.bot)) return;
      onRemove(reaction, user);
    },
  );
}

export function listenUserMessages(
  channel: Discord.TextChannel,
  onMessage: (message: Discord.Message) => void,
) {
  eventController.eventBus.task(
    Discord.Events.MessageCreate,
    'listenChannel',
    (message: Discord.Message) => {
      if (message.channelId !== channel.id || message.author.bot) return;
      onMessage(message);
    },
  );
}
