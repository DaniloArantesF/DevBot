import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';
import { EventLog } from '@/tasks/logs';

export const error: DiscordEvent<Events.Error> = {
  name: Events.Error,
  async on(error) {
    return EventLog('error', stringifyCircular({ error }));
  },
};
