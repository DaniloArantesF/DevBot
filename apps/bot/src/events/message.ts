import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';

export const messageCreate: DiscordEvent<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async on(message) {
    // console.log(message);
  },
};
