import { Client, Collection } from 'discord.js';
import { getCommands } from './commands';
import { getEvents } from './events';
import { TOKEN, INTENTS as intents } from '@config';
import type { BotProvider, DiscordCommand, DiscordConnection } from '@utils/types';

class DiscordClient extends Client {
  commands = new Collection<string, DiscordCommand>();
  connections = new Map<string, DiscordConnection>();

  constructor(provider: BotProvider) {
    super({
      intents,
    });

    this.login(TOKEN);
    this.registerEvents();
    this.registerCommands();
  }

  registerCommands() {
    const commands = getCommands();
    commands.forEach((command) => {
      this.commands.set(command.data.name, command);
    });
  }

  registerEvents() {
    const events = getEvents();
    events.forEach((event) => {
      if (event.once) this.once(event.name, event.on);
      else this.on(event.name, event.on);
    });
  }
}

export default DiscordClient;
