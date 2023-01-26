import { Client, Collection } from 'discord.js';
import { getCommands } from '@/controllers/commands';
import { getEvents } from '@/events';
import { TOKEN, INTENTS as intents } from '@config';
import type { BotProvider, DiscordCommand, DiscordConnection } from '@/utils/types';

class DiscordClient extends Client {
  commands = new Collection<string, DiscordCommand>();
  connections = new Map<string, DiscordConnection>();

  constructor(provider: BotProvider) {
    super({
      intents,
    });

    this.registerEvents();
    this.registerCommands();
    this.login(TOKEN);
  }

  async registerCommands() {
    const commands = await getCommands();
    commands.forEach((command) => {
      this.commands.set(command.data.name, command);
    });
  }

  async registerEvents() {
    const events = await getEvents();
    events.forEach((event) => {
      if (event.once) this.once(event.name, event.on);
      else this.on(event.name, event.on);
    });
  }
}

export default DiscordClient;
