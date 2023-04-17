import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { withEventLogging } from '@/utils';
import { logger } from 'shared/logger';

export const invalidated: DiscordEvent<Events.Invalidated> = {
  name: Events.Invalidated,
  on: withEventLogging('invalidated', async () => {
    logger.Error('Event', 'The client has been invalidated');
  }),
};
