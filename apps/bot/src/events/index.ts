import fs from 'fs';
import dotenv from 'dotenv';
import { DiscordEvent } from '@utils/types';
dotenv.config();

export function getEvents() {
  const events: DiscordEvent[] = [];
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
