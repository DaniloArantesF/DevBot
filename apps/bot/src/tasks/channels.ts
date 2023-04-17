import { getGuild } from '@/tasks/guild';
import Discord from 'discord.js';

export async function createChannel<T extends Discord.GuildChannelTypes>(
  guildId: string,
  options: Discord.GuildChannelCreateOptions,
) {
  const guild = getGuild(guildId);
  return guild?.channels.create(options) as Promise<Discord.MappedGuildChannelTypes[T]>;
}

export async function deleteChannel(guildId: string, channelId: string) {
  const channel = getGuildChannel(guildId, channelId);
  return channel?.delete();
}

// Returns all channels of a guild
export function getGuildChannels(guildId: string) {
  const guild = getGuild(guildId);
  return guild?.channels.cache ?? null;
}

// Returns a channel by name or id
export function getGuildChannel(guildId: string, channelId: string | null, channelName?: string) {
  const guild = getGuild(guildId);
  if (channelName) return guild?.channels.cache.find((channel) => channel.name === channelName);
  return guild?.channels.cache.get(channelId!) ?? null;
}

// Returns current members of a channel
export function getGuildChannelPresence(guildId: string, channelId: string) {
  const guild = getGuild(guildId);
  const channel = guild?.channels.cache.get(channelId);
  return channel?.members ?? null;
}

export async function purgeChannel(guildId: string, channelId: string, limit = 100) {
  const channel = (await getGuildChannel(guildId, channelId)) as Discord.TextChannel;
  if (!channel || !channel.isTextBased()) return new Error('Invalid channel!');
  return channel.bulkDelete(limit, true);
}

export function getRulesChannel(guildId: string) {
  const guild = getGuild(guildId);
  return guild?.rulesChannel;
}
