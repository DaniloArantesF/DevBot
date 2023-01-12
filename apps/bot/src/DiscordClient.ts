import { Client, Collection } from 'discord.js';
import type { VoiceConnection } from '@discordjs/voice';
import { Command, getCommands } from './commands/';
import { getEvents } from './events';
import { TOKEN, INTENTS as intents } from '@config';

interface DiscordConnection {
  connection: VoiceConnection;
}

class DiscordClient extends Client {
  commands = new Collection<string, Command>();
  connections = new Map<string, DiscordConnection>();

  constructor() {
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

const DiscordClientSync = () =>
  new Promise<DiscordClient>((resolve, reject) => {
    const client = new DiscordClient();
    client.on('ready', () => resolve(client));
  });

export default DiscordClientSync;
export type { DiscordClient };