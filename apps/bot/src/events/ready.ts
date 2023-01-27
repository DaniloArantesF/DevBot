import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';

export const ready: DiscordEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  async on() {
    console.log('DiscordClient connected');
  },
};
