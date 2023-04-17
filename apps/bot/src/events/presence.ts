import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { withEventLogging } from '@/utils';

export const presenceUpdate: DiscordEvent<Events.PresenceUpdate> = {
  name: Events.PresenceUpdate,
  on: withEventLogging('presenceUpdate', async (oldPresence, newPresence) => {}),
};
