import discordClient from '@/DiscordClient';
import dataProvider from '@/DataProvider';
import taskManager from '@/TaskManager';

import { API_HOSTNAME, API_PORT, BOT_CONFIG, CLIENT_URL, REDIS_URL } from 'shared/config';
import { logger } from 'shared/logger';
import { POCKETBASE_BASE_URL } from './utils/config';
import api from '@/api';
import { getGuild } from './tasks/guild';
import Discord from 'discord.js';
import { GuildBotContext, TPocketbase } from 'shared/types';
import { createChannel } from './tasks/channels';
import { GuildContext } from './utils/factories';
import { RulesManager } from './controllers/features/rules';
import { UserRoleManager } from './controllers/features/userRoles';
import { UserChannelManager } from './controllers/features/userChannels';
import ModerationManager from './controllers/features/moderation';

class Bot {
  config = BOT_CONFIG;
  isReady: Promise<boolean>;
  userCooldown = new Map<string, number>();
  guilds: Map<string, GuildBotContext> = new Map();
  motherGuild: Discord.Guild | null = null;

  /* Features */
  rulesManager = new RulesManager();
  userRoleManager = new UserRoleManager();
  userChannelManager = new UserChannelManager();
  moderationManager = new ModerationManager();

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
    await taskManager.setupTaskControllers();
    await dataProvider.connect();
    this.config.loadPlugins && (await taskManager.setupPlugins());

    return new Promise<boolean>((resolve, reject) => {
      // Setup
      discordClient.on('ready', async () => {
        try {
          this.main();
          resolve(true);
        } catch (error) {
          logger.Error('Bot', 'Error starting the bot.');
          console.error(error);
          reject(false);
          this.shutdown();
        }
      });
    });
  }

  // Called when discord client is ready
  // and database is connected
  async main() {
    logger.Info('Bot', 'Starting setup ...');
    logger.setLevel(this.config.logLevel);

    this.motherGuild = getGuild(BOT_CONFIG.motherGuildId) || null;
    if (this.motherGuild) {
      this.guilds.set(this.motherGuild!.id, GuildContext());
    }

    // Setup moderation module
    await this.moderationManager.setup();

    const guildRepository = dataProvider.guild;
    // Create guilds in database if they don't exist
    await guildRepository.init(discordClient.guilds.cache.map((guild) => guild));

    // Configure motherguild
    if (this.motherGuild) {
      await this.setupBotLogChannel();
    }

    const guilds = await guildRepository.getAll();
    for (const guild of guilds) {
      // Init guild context
      this.guilds.set(guild.guildId, GuildContext({ moderationConfig: { ...guild.moderation } }));

      if (!guild.managed) continue;
      if (this.config.autoSetup) {
        await this.setupGuild(guild);
      }
    }

    if (BOT_CONFIG.autoProcess) {
      await taskManager.initProcessing();
    }

    logger.Info('Bot', 'Finished setup.');
    api.start();
  }

  // Guild setup checks
  // Add/Update roles message
  async setupGuild(guild: TPocketbase.Guild) {
    logger.Debug('Bot', `Setting up guild ${guild.guildId} ...`);
    try {
      await this.rulesManager.setupGuild(guild);
      await this.userRoleManager.setupGuild(guild);
      await this.userChannelManager.setupGuild(guild);
      // await this.moderationManager.setupGuild(guild);
    } catch (error) {
      console.error(error);
      logger.Error('Bot', (error as any).message);
    }
  }

  // Idempotent function to setup the base channels
  setupBaseChannels() {
    // Welcome
    // announcements
    // server logs
    // bot logs
    // help
    // bug report / feature request
    // Check that category exists, if not create it
    // For each channel, check if it exists, if not create it
  }

  // Idempotent function to setup a channel
  // Searches for a matching channel and creates it if it doesn't exist
  // Caller is responsible for ensuring that the parent exists
  async setupChannel(
    guild: Discord.Guild,
    identifiers: {
      name: string;
      type: Discord.ChannelType.GuildText | Discord.ChannelType.GuildCategory;
      entityId: string;
    },
    parentId?: string,
  ) {}

  /** Functions used in private bot guild */
  async setupBotLogChannel() {
    if (!this.motherGuild) return;
    const botLogChannelName = 'bot-logs';
    let botLogChannel = this.motherGuild.channels.cache.find(
      (c) => c.name === botLogChannelName && c.type === Discord.ChannelType.GuildText,
    ) as Discord.TextChannel;

    if (!botLogChannel) {
      logger.Info('Bot', 'Creating bot log channel.');
      botLogChannel = await createChannel<Discord.ChannelType.GuildText>(this.motherGuild.id, {
        name: botLogChannelName,
        type: Discord.ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: this.motherGuild.roles.everyone.id,
            deny: Discord.PermissionsBitField.Flags.ViewChannel,
          },
          {
            id: this.motherGuild.roles.botRoleFor(this.motherGuild.members.me!.id)!.id,
            allow: Discord.PermissionsBitField.Flags.ViewChannel,
          },
        ],
      });
      await botLogChannel.send('Created log channel');
    } else {
      await botLogChannel.send('Bot restarted');
    }
    this.guilds.get(this.motherGuild.id)!.logChannel = botLogChannel;
  }

  async shutdown() {
    logger.Info('Bot', 'Shutting down ...');
    taskManager.shutdown();
    discordClient.destroy();
    process.exit(1);
  }
}

const bot = new Bot();
export default bot;
process.on('uncaughtException', console.error);
