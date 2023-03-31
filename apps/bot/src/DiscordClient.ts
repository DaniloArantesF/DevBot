import { Client, Collection } from 'discord.js';
import { getCommands } from '@/tasks/commands';
import { getEvents } from '@/tasks/event';
import { TOKEN, INTENTS as intents } from '@config';
import type { TBot, DiscordConnection, DiscordEvent } from '@/utils/types';
import { logger } from 'shared/logger';
import eventController from './controllers/eventController';

class DiscordClient extends Client {
  commands = new Collection<string, TBot.Command>();
  events = new Collection<string, DiscordEvent>();
  connections = new Map<string, DiscordConnection>();

  constructor() {
    super({
      intents,
      rest: {
        globalRequestsPerSecond: 49,
        // rejectOnRateLimit: () => true,
        retries: 0,
      },
    });
    this.registerEvents();
    this.registerCommands();
    this.login(TOKEN);

    this.on('ready', () => logger.Info('DiscordClient', 'Connected.'));
  }

  async registerCommands() {
    const commands = await getCommands();
    commands.forEach((command) => {
      if (!command.data) return;
      this.commands.set(command.data.name, command);
    });
  }

  async registerEvents() {
    const events = await getEvents();
    events.forEach((event) => {
      this.events.set(event.name, event);
      if (event.on) {
        this.on(event.name, async (...args) => {
          await eventController.addTask(event, args);
        });
      } else {
        this.once(event.name, async (...args) => {
          await eventController.addTask(event, args);
        });
      }
    });
  }
}

const discordClient = new DiscordClient();
export default discordClient;
