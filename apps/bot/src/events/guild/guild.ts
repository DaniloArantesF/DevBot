import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular, withEventLogging } from '@/utils';
import { EventLog } from '@/tasks/logs';
import dataProvider from '@/DataProvider';
import { BOT_CONFIG } from 'shared/config';
import { logger } from 'shared/logger';

export const guildCreate: DiscordEvent<Events.GuildCreate> = {
  name: Events.GuildCreate,
  on: withEventLogging('guildCreate', async (guild) => {
    logger.Info('Event: guildCreate', `Creating guild record for ${guild.name} (${guild.id}) ...`);
    return await dataProvider.guild.create({
      guildId: guild.id,
      name: guild.name,
      userRoles: [],
      userChannels: [],
      description: '',
      memberRoleId: '',
      channels: [],
      plugins: [],
      managed: false,
      moderation: {
        ...BOT_CONFIG.globalModerationConfig,
      },
    });
  }),
};

export const guildUpdate: DiscordEvent<Events.GuildUpdate> = {
  name: Events.GuildUpdate,
  on: withEventLogging('guildUpdate', async (oldGuild, newGuild) => {
    // logger.Info(
    //   'Event: guildUpdate',
    //   `Updating guild record for ${newGuild.name} (${newGuild.id}) ...`,
    // );
    // return await dataProvider.guild.update({
    //   guildId: newGuild.id,
    //   name: newGuild.name,
    // });
  }),
};
