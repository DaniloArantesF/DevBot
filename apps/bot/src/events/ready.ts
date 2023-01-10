import { Events } from 'discord.js';
import { Event } from '.';

export const event: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  async on() {
    console.log('Discord Client is connected');
  },
};
