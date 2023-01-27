import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';
import { EventLog } from '@/tasks/logs';

export const presenceUpdate: DiscordEvent<Events.PresenceUpdate> = {
  name: Events.PresenceUpdate,
  async on(oldPresence, newPresence) {
    return EventLog('presenceUpdate', stringifyCircular({ oldPresence, newPresence }));
  },
};
