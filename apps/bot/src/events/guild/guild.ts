import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';
import { EventLog } from '@/tasks/logs';
import dataProvider from '@/DataProvider';
import { BOT_CONFIG } from 'shared/config';
import { logger } from 'shared/logger';

export const guildCreate: DiscordEvent<Events.GuildCreate> = {
  name: Events.GuildCreate,
  async on(guild) {
    logger.Info('Event: guildCreate', `Creating guild record for ${guild.name} (${guild.id}) ...`);
    await dataProvider.guild.create({
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
    return EventLog('guildCreate', stringifyCircular({ guild }));
  },
};

export const guildUpdate: DiscordEvent<Events.GuildUpdate> = {
  name: Events.GuildUpdate,
  async on(guild) {
    return EventLog('guildUpdate', stringifyCircular({ guild }));
  },
};
