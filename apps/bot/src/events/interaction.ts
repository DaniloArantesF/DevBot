import { Events } from 'discord.js';
import { Event } from '.';

export const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async on(interaction) {
    // console.log(interaction)
  },
};
