import DiscordClient from './DiscordClient';
import DataProvider from './DataProvider';
import API from './api';
import TaskManager from './TaskManager';

export interface BotProvider {
  services: Partial<{
    [key: string]: any;
    discordClient: DiscordClient;
    api: typeof API;
    dataProvider: typeof DataProvider;
    taskManager: typeof TaskManager;
  }>;
  addService: (name: string, service: any) => void;
  getService: (name: string) => any;
}

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
  botProvider.addService('api', API(botProvider));
  botProvider.addService('dataProvider', await DataProvider(botProvider));
  botProvider.addService('taskManager', TaskManager(botProvider));

  return botProvider;
}

console.clear();
export const botProvider = Bot();
botProvider.then((provider) => {
  provider.getService('taskManager').initProcessing();
});
