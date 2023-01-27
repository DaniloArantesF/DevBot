import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { EventLog } from '@/tasks/logs';

export const invalidated: DiscordEvent<Events.Invalidated> = {
  name: Events.Invalidated,
  async on() {
    return EventLog('invalidated');
  },
};
