import Discord from 'discord.js';
import { getGuildChannels } from './channels';
import discordClient from '@/DiscordClient';
import {
  ConfigCollection,
  GuildConfigChannel,
  GuildConfigExport,
  GuildConfigUserRole,
  GuildSnapshot,
  TPocketbase,
} from 'shared/types';
import dataProvider from '@/DataProvider';
import TextRegistry from '@/utils/messageManager';

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
    if (channel.type !== Discord.ChannelType.GuildVoice) return;
    const presence = channel.members;
    network[channel.name] = presence;
  });

  return network;
}

export async function setGuildNotifications(
  guildId: string,
  option: Discord.GuildDefaultMessageNotifications,
) {
  const guild = getGuild(guildId);
  await guild?.setDefaultMessageNotifications(option);
}

// Gets the current channels
// Returns the configuration object or null on error
export async function exportGuildConfig(guildId: string): Promise<GuildConfigExport | null> {
  const guild = getGuild(guildId);
  if (!guild) {
    return null;
  }

  // Gets all the current roles, excluding just @everyone
  const guildRoles = guild.roles.cache.reduce(
    (
      collection,
      { color, hoist, icon, mentionable, name, permissions, unicodeEmoji, managed, ...role },
      key,
    ) => {
      if (role.id === guild.roles.everyone.id) {
        return collection;
      }
      collection[key] = {
        color,
        hoist,
        icon,
        mentionable,
        name,
        permissions: permissions.toArray(),
        unicodeEmoji,
        managed: managed,
        userAssignable: !permissions.has('Administrator'),
      };
      return collection;
    },
    {} as ConfigCollection<GuildConfigUserRole>,
  );

  const guildChannels = guild.channels.cache.reduce((collection, c, key) => {
    const channel = c as Discord.GuildChannel;
    const { name, type, parent, flags, manageable } = channel;
    const channelData = {
      name,
      description: '',
      type: type.toString(), // TODO: move to actual type strings
      subChannels: {},
      allowedRoles: [
        ...guild.roles.cache
          .filter((role) => channel.permissionsFor(role).has('ViewChannel'))
          .map((role) => role.id),
      ],
      moderation: {
        language: {
          enabled: false,
          allowed: [],
          roleExceptions: [],
        },
        content: {
          enabled: false,
          allowed: [],
          roleExceptions: [],
        },
      },
      manageable,
      flags: flags.toArray(),
      plugin: null,
    };

    if (type === Discord.ChannelType.GuildCategory || parent === null) {
      collection[key] = channelData;
    } else {
      // Subchannel, add it to the parent
      const parentIndex = Object.keys(collection).find(
        (key) => collection[key].name === parent.name,
      );
      const parentChannel = parentIndex ? collection[parentIndex] : null;
      if (!parentChannel) {
        return collection;
      }
      parentChannel.subChannels[key] = channelData;
    }

    return collection;
  }, {} as ConfigCollection<GuildConfigChannel>);

  return {
    roles: guildRoles,
    rules: {
      channelName: guild.rulesChannel?.name || TextRegistry.names.rulesChannel,
      message: TextRegistry.messages.rulesMessage(),
    },
    channels: guildChannels,
    plugins: [],
  };
}

export async function createGuildSnapshot(guildId: string): Promise<GuildSnapshot | null> {
  const guildMembers = await getGuild(guildId)?.members.fetch();
  if (!guildMembers) {
    return null;
  }
  const guildConfig = await exportGuildConfig(guildId);
  if (!guildConfig) {
    return null;
  }
  const guild = await dataProvider.guild.get(guildId);
  const guildSnapshot: GuildSnapshot = {
    ...guildConfig,
    members: [],
    guild: guild.id,
  };
  guildSnapshot.members =
    (await Promise.all(
      guildMembers.map((member) => {
        return {
          id: member.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          roles: member.roles.cache.map((role) => role.id),
        };
      }),
    )) ?? [];
  return guildSnapshot;
}

// TODO
export async function resetGuildConfig(guild: TPocketbase.Guild) {}
