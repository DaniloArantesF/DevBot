import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular, withEventLogging } from '@/utils';
import { logger } from 'shared/logger';

export const error: DiscordEvent<Events.Error> = {
  name: Events.Error,
  on: withEventLogging('error', async (error) =>
    logger.Error('Event', stringifyCircular({ error })),
  ),
};
