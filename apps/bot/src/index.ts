import DiscordClient from './DiscordClient';
import DataProvider from './DataProvider';
import API from './api';
import TaskManager from './TaskManager';
import type { BotProvider } from '@utils/types';

async function Bot() {
  const botProvider: BotProvider = {
    services: {},
    addService(name, service) {
      this.services[name] = service;
    },
    getService(name) {
      return this.services[name];
    },
  };

  // Add services
  botProvider.addService('discordClient', new DiscordClient(botProvider));
  botProvider.addService('taskManager', TaskManager(botProvider));
  botProvider.addService('dataProvider', await DataProvider(botProvider));
  botProvider.addService('api', API(botProvider));

  const discordClient = botProvider.getService('discordClient') as DiscordClient;

  discordClient.on('ready', () => {
    discordClient.guilds.cache.forEach((guild) => {
      console.log(`Logged in as ${discordClient.user?.tag} on ${guild.name} (${guild.id})`);
    });
  });

  return botProvider;
}

console.clear();
const botProvider = Bot();
export default botProvider;
