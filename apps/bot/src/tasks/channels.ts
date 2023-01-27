import { getGuild } from '@/tasks/guild';

// Returns all channels of a guild
export async function getGuildChannels(guildId: string) {
  const guild = await getGuild(guildId);
  return guild.channels.cache;
}

// Returns a channel by name or id
export async function getGuildChannel(guildId: string, channelId?: string, channelName?: string) {
  const guild = await getGuild(guildId);
  if (channelName) return guild.channels.cache.find((channel) => channel.name === channelName);
  return guild.channels.cache.get(channelId);
}

// Returns current members of a channel
export async function getGuildChannelPresence(guildId: string, channelId: string) {
  const guild = await getGuild(guildId);
  const channel = guild.channels.cache.get(channelId);
  return channel.members;
}
