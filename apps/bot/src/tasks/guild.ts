import { ChannelType } from 'discord.js';
import { getGuildChannels } from './channels';
import discordClient from '@/DiscordClient';

export function getGuild(guildId: string) {
  return discordClient.guilds.cache.get(guildId);
}

export async function getGuildByName(guildName: string) {
  return discordClient.guilds.cache.find((guild) => guild.name === guildName);
}

/**
 * Returns active users in a guild
 * e.g. users online and/or in a voice channel
 * @param guildId
 */
export async function getGuildNetwork(guildId: string) {
  const channels = await getGuildChannels(guildId);
  const network: any = {};

  channels?.forEach((channel) => {
    if (channel.type !== ChannelType.GuildVoice) return;
    const presence = channel.members;
    network[channel.name] = presence;
  });

  return network;
}
