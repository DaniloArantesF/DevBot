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
    getDiscordClient() {
      return this.services.discordClient as DiscordClient;
    },
    getTaskManager() {
      return this.services.taskManager as typeof TaskManager;
    },
    getDataProvider() {
      return this.services.dataProvider as typeof DataProvider;
    },
    getApi() {
      return this.services.api as typeof API;
    },
  };

  // Add services
  botProvider.addService('discordClient', new DiscordClient(botProvider));
  botProvider.addService('taskManager', TaskManager(botProvider));
  botProvider.addService('dataProvider', await DataProvider(botProvider));
  botProvider.addService('api', API(botProvider));

  const discordClient = botProvider.getService('discordClient') as DiscordClient;

  discordClient.on('ready', async () => {
    const guildRepository = (await (await botProvider.getService('dataProvider') as ReturnType<typeof DataProvider>)).guild;

    guildRepository.init(discordClient.guilds.cache.map((guild) => guild));
  });

  return botProvider;
}

console.clear();
const botProvider = Bot();
export default botProvider;
