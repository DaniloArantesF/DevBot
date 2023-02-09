import { Client, Collection } from 'discord.js';
import { getCommands } from '@/tasks/commands';
import { getEvents } from '@/tasks/event';
import { TOKEN, INTENTS as intents } from '@config';
import type { BotProvider, TBot, DiscordConnection, DiscordEvent } from '@/utils/types';

class DiscordClient extends Client {
  commands = new Collection<string, TBot.Command>();
  events = new Collection<string, DiscordEvent>();
  connections = new Map<string, DiscordConnection>();
  provider: BotProvider;

  constructor(provider: BotProvider) {
    super({
      intents,
    });

    this.provider = provider;
    this.registerEvents();
    this.registerCommands();
    this.login(TOKEN);
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
    const taskManager = this.provider.getTaskManager();
    const eventController = taskManager.eventController;
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

export default DiscordClient;
