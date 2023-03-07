import { getGuild } from '@/tasks/guild';
import { GuildChannelCreateOptions } from 'discord.js';

export async function createChannel<T>(guildId: string, options: GuildChannelCreateOptions) {
  const guild = await getGuild(guildId);
  return guild?.channels.create(options) as T ?? null;
}

// Returns all channels of a guild
export async function getGuildChannels(guildId: string) {
  const guild = await getGuild(guildId);
  return guild?.channels.cache ?? null;
}

// Returns a channel by name or id
export async function getGuildChannel(guildId: string, channelId?: string, channelName?: string) {
  const guild = await getGuild(guildId);
  if (channelName) return guild?.channels.cache.find((channel) => channel.name === channelName);
  return guild?.channels.cache.get(channelId!) ?? null;
}

// Returns current members of a channel
export async function getGuildChannelPresence(guildId: string, channelId: string) {
  const guild = await getGuild(guildId);
  const channel = guild?.channels.cache.get(channelId);
  return channel?.members ?? null;
}

export async function purgeChannel(guildId: string, channelId: string, limit = 100) {
  const channel = await getGuildChannel(guildId, channelId);
  if (!channel || !channel.isTextBased()) return new Error('Invalid channel!');
  return channel.bulkDelete(limit, true);
}
