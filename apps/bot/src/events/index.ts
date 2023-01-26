import fs from 'fs';
import dotenv from 'dotenv';
import { DiscordEvent } from '@/utils/types';
dotenv.config();

export async function getEvents() {
  const events: DiscordEvent[] = [];
  const eventFiles = fs
    .readdirSync(process.env.NODE_ENV === 'prod' ? 'dist/events/' : 'src/events/')
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of eventFiles) {
    const event = (await import(`./${file}`)).event;
    if (!event?.name || file.match(/index\.(ts|js)/)) continue;
    events.push(event);
  }

  return events;
}
