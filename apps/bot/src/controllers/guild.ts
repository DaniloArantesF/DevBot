import botProvider from '@/index';
import { ChannelType, GuildMember, PresenceData } from 'discord.js';
import { getGuildChannels } from './channels';

export async function getGuild(guildId: string) {
  const client = (await botProvider).getDiscordClient();
  return client.guilds.cache.get(guildId);
}

export async function getGuildByName(guildName: string) {
  const client = (await botProvider).getDiscordClient();
  return client.guilds.cache.find((guild) => guild.name === guildName);
}

type GuildPresence = PresenceData & {
  user: GuildMember;
};

type GuildPresenceNetwork = {};

/**
 * Returns active users in a guild
 * e.g. users online and/or in a voice channel
 * @param guildId
 */
export async function getGuildNetwork(guildId: string) {
  const channels = await getGuildChannels(guildId);
  const network: any = {};

  channels.forEach((channel) => {
    if (channel.type !== ChannelType.GuildVoice) return;
    const presence = channel.members;
    network[channel.name] = presence;
  });

  return network;
}
