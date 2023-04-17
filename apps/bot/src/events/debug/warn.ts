import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { withEventLogging } from '@/utils';
import { logger } from 'shared/logger';

export const warn: DiscordEvent<Events.Warn> = {
  name: Events.Warn,
  on: withEventLogging('warn', async (message) => {
    logger.Warning('Event', message);
  }),
};
