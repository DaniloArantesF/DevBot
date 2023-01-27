import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';
import { EventLog } from '@/tasks/logs';

export const warn: DiscordEvent<Events.Warn> = {
  name: Events.Warn,
  async on(message) {
    return EventLog('warn', stringifyCircular({ message }));
  },
};
