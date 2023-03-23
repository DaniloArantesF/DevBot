import DiscordClient from '@/DiscordClient';
import DataProvider from '@/DataProvider';
import TaskManager from '@/TaskManager';
import type { BotProvider } from '@/utils/types';
import { setRolesMessage } from '@/tasks/roles';
import { API_HOSTNAME, API_PORT, BOT_CONFIG, CLIENT_URL, REDIS_URL } from 'shared/config';
import { logger } from 'shared/logger';
import { POCKETBASE_BASE_URL } from './utils/config';
import api from '@/api';

async function Bot() {
  logger.Header([
    `Client: ${CLIENT_URL}`,
    `API: ${API_HOSTNAME}:${API_PORT}`,
    `Pocketbase: ${POCKETBASE_BASE_URL}`,
    `Redis: ${REDIS_URL}`,
  ]);

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
      return this.services.discordClient!;
    },
    getTaskManager() {
      return this.services.taskManager!;
    },
    getDataProvider() {
      return this.services.dataProvider!;
    },
    getApi() {
      return this.services.api!;
    },
  };

  // Add services
  botProvider.addService('dataProvider', new DataProvider(botProvider));
  botProvider.addService('discordClient', new DiscordClient(botProvider));
  botProvider.addService('taskManager', TaskManager(botProvider));
  botProvider.addService('api', api);

  const discordClient = botProvider.getDiscordClient();
  const dataProvider = botProvider.getDataProvider();
  const taskManager = botProvider.getTaskManager();

  async function main() {
    await guildSetup();
    api.start();

    if (BOT_CONFIG.autoProcess) {
      await taskManager.initProcessing();
    }
    await taskManager.setupPlugins();
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
        await setRolesMessage(guild.guildId, guild.rolesChannelId, guild.userRoles);
      }
    }
  }

  return new Promise<BotProvider>((resolve, reject) => {
    // Setup
    discordClient.on('ready', async () => {
      try {
        await dataProvider.connect();
        resolve(botProvider);
        main();
      } catch (error) {
        console.info(error);
        console.info('Shutting down ...');
        taskManager.shutdown();
        discordClient.destroy();
        process.exit(1);
      }
    });
  });
}

// console.clear();
const botProvider = Bot();
export default botProvider;
