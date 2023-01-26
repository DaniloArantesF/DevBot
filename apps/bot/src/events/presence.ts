import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';

export const event: DiscordEvent<Events.PresenceUpdate> = {
  name: Events.PresenceUpdate,
  async on(oldPresence, newPresence) {
    return {
      event: 'PresenceUpdate',
      data: stringifyCircular({ oldPresence, newPresence }),
    };
  },
};
