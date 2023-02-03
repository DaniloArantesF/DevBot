import DiscordClient from '@/DiscordClient';
import DataProvider from '@/DataProvider';
import API from '@/api';
import TaskManager from '@/TaskManager';
import type { BotProvider } from '@utils/types';
import { setRolesMessage } from './tasks/roles';

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
  botProvider.addService('dataProvider', new DataProvider(botProvider));
  botProvider.addService('discordClient', new DiscordClient(botProvider));
  botProvider.addService('taskManager', TaskManager(botProvider));
  botProvider.addService('api', API(botProvider));

  const discordClient = botProvider.getDiscordClient();
  const dataProvider = botProvider.getDataProvider();
  const taskManager = botProvider.getTaskManager();

  async function main() {
    await guildSetup();
  }

  // Guild setup checks
  // Create guilds in database if they don't exist
  // Add/Update roles message
  async function guildSetup() {
    const guildRepository = dataProvider.guild;
    await guildRepository.init(discordClient.guilds.cache.map((guild) => guild));

    const guilds = await guildRepository.getAll();
    for (const guild of guilds) {
      if (guild.rolesChannelId && guild.rolesMessageId) {
        await setRolesMessage(guild.guildId, guild.rolesChannelId);
      }
    }
  }

  return new Promise<BotProvider>((resolve) => {
    // Setup
    discordClient.on('ready', async () => {
      await dataProvider.connect();
      resolve(botProvider);
      main();
    });
  });
}

console.clear();
const botProvider = Bot();
export default botProvider;
