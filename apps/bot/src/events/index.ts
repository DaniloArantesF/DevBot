import fs from 'fs';
import dotenv from 'dotenv';
import { ClientEvents } from 'discord.js';
dotenv.config();

export interface Event<K extends keyof ClientEvents = any> {
  name: K;
  on?: (...args: ClientEvents[K]) => void | Promise<void>;
  once?: (...args: ClientEvents[K]) => void | Promise<void>;
}

export function getEvents() {
  const events: Event[] = [];
  const eventFiles = fs
    .readdirSync(process.env.NODE_ENV === 'prod' ? 'dist/events/' : 'src/events/')
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of eventFiles) {
    const event = require(`./${file}`).event;
    if (!event?.name || file.match(/index\.(ts|js)/)) continue;
    events.push(event);
  }

  return events;
}
