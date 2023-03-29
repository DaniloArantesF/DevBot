import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { logger } from 'shared/logger';

export const debug: DiscordEvent<Events.Debug> = {
  name: Events.Debug,
  async on(message) {
    message = message.replace(/DEBUG /g, '');
    logger.Debug('DiscordClient', message);
    // return EventLog('debug', stringifyCircular({ message }));
  },
};

// export {};
