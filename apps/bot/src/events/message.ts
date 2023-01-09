import { Events } from 'discord.js';
import { Event } from '.';

export const event: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async on(message) {
    // console.log(message);
  },
};
