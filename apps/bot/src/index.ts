import DiscordClient from '@/DiscordClient';
import DataProvider from '@/DataProvider';
import API from '@/api';
import TaskManager from '@/TaskManager';
import type { BotProvider } from '@utils/types';

async function Bot() {
  const botProvider: BotProvider = {
    services: {},
    userCooldown: new Map(),
    addService(name, service) {
      this.services[name] = service;
    },
    getService(name) {
      return this.services[name];
    },
    getDiscordClient() {
      return this.services.discordClient;
    },
    getTaskManager() {
      return this.services.taskManager;
    },
    getDataProvider() {
      return this.services.dataProvider;
    },
    getApi() {
      return this.services.api;
    },
  };

  // Add services
  botProvider.addService('discordClient', new DiscordClient(botProvider));
  botProvider.addService('taskManager', TaskManager(botProvider));
  botProvider.addService('dataProvider', await DataProvider(botProvider));
  botProvider.addService('api', API(botProvider));

  const discordClient = botProvider.getService('discordClient') as DiscordClient;

  return new Promise<BotProvider>((resolve) => {
    discordClient.on('ready', async () => {
      // Setup
      const guildRepository = (await botProvider.getDataProvider()).guild;
      guildRepository.init(discordClient.guilds.cache.map((guild) => guild));

      resolve(botProvider);
    });
  });
}

console.clear();
const botProvider = Bot();
export default botProvider;
