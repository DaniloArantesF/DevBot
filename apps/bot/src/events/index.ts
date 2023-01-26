import fs from 'fs';
import dotenv from 'dotenv';
import { DiscordEvent } from '@/utils/types';
dotenv.config();

export async function getEvents() {
  const events: DiscordEvent[] = [];
  const files = fs.readdirSync(process.env.NODE_ENV === 'prod' ? 'dist/events/' : 'src/events/', {
    withFileTypes: true,
  });

  let eventFiles: string[] = [];

  // Read subdirectories
  files.forEach((file) => {
    if (file.isDirectory()) {
      const subFiles = fs.readdirSync(
        process.env.NODE_ENV === 'prod' ? `dist/events/${file.name}/` : `src/events/${file.name}/`,
        { withFileTypes: true },
      );
      subFiles.forEach((subFile) => {
        eventFiles.push(`${file.name}/${subFile.name}`);
      });
    } else {
      eventFiles.push(file.name);
    }
  });

  eventFiles = eventFiles.filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of eventFiles) {
    const event = (await import(`./${file}`)).event;
    if (!event?.name || file.match(/index\.(ts|js)/)) continue;
    events.push(event);
  }

  return events;
}
