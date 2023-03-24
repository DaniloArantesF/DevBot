import { getGuild } from '@/tasks/guild';
import {
  ChannelType,
  GuildChannelCreateOptions,
  GuildChannelType,
  GuildChannelTypes,
  MappedGuildChannelTypes,
  TextChannel,
} from 'discord.js';

export function createChannel<T extends GuildChannelTypes>(
  guildId: string,
  options: GuildChannelCreateOptions,
) {
  const guild = getGuild(guildId);
  return guild?.channels.create(options) as Promise<MappedGuildChannelTypes[T]>;
}

export async function deleteChannel(guildId: string, channelId: string) {
  const channel = await getGuildChannel(guildId, channelId);
  return channel?.delete();
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
export function getGuildChannelPresence(guildId: string, channelId: string) {
  const guild = getGuild(guildId);
  const channel = guild?.channels.cache.get(channelId);
  return channel?.members ?? null;
}

export async function purgeChannel(guildId: string, channelId: string, limit = 100) {
  const channel = (await getGuildChannel(guildId, channelId)) as TextChannel;
  if (!channel || !channel.isTextBased()) return new Error('Invalid channel!');
  return channel.bulkDelete(limit, true);
}

export function getRulesChannel(guildId: string) {
  const guild = getGuild(guildId);
  return guild?.rulesChannel;
}
