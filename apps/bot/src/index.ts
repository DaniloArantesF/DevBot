import discordClient from '@/DiscordClient';
import dataProvider from '@/DataProvider';
import taskManager from '@/TaskManager';
import { setRolesMessage } from '@/tasks/roles';
import { API_HOSTNAME, API_PORT, BOT_CONFIG, CLIENT_URL, REDIS_URL } from 'shared/config';
import { logger } from 'shared/logger';
import { POCKETBASE_BASE_URL } from './utils/config';
import api from '@/api';

class Bot {
  isReady: Promise<void>;
  userCooldown = new Map<string, number>();

  constructor() {
    logger.Header([
      `Client: ${CLIENT_URL}`,
      `API: ${API_HOSTNAME}:${API_PORT}`,
      `Pocketbase: ${POCKETBASE_BASE_URL}`,
      `Redis: ${REDIS_URL}`,
    ]);
    this.isReady = this.setup();
  }

  async setup() {
    return new Promise<void>((resolve, reject) => {
      // Setup
      discordClient.on('ready', async () => {
        try {
          await dataProvider.connect();
          this.main();
          resolve();
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

  async main() {
    await this.guildSetup();
    api.start();

    await taskManager.setupTaskControllers();
    if (BOT_CONFIG.autoProcess) {
      await taskManager.initProcessing();
    }
    await taskManager.setupPlugins();
  }

  // Guild setup checks
  // Create guilds in database if they don't exist
  // Add/Update roles message
  async guildSetup() {
    const guildRepository = dataProvider.guild;
    await guildRepository.init(discordClient.guilds.cache.map((guild) => guild));

    const guilds = await guildRepository.getAll();
    for (const guild of guilds) {
      if (guild.rolesChannelId && guild.rolesMessageId) {
        await setRolesMessage(guild.guildId, guild.rolesChannelId, guild.userRoles);
      }
    }
  }

}

// console.clear();
const bot = new Bot();
export default bot;
