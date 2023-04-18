import discordClient from '@/DiscordClient';
import dataProvider from '@/DataProvider';
import taskManager from '@/TaskManager';
import { API_HOSTNAME, API_PORT, BOT_CONFIG, CLIENT_URL, REDIS_URL } from 'shared/config';
import { logger } from 'shared/logger';
import { POCKETBASE_BASE_URL } from '@/utils/config';
import api from '@/api';
import { getGuild } from '@/tasks/guild';
import Discord from 'discord.js';
import { GuildBotContext, GuildConfigChannel, TPocketbase } from 'shared/types';
import { createChannel, getGuildChannel } from '@/tasks/channels';
import { GuildContext } from '@/utils/factories';
import { RulesManager } from '@/controllers/features/rules';
import { UserRoleManager } from '@/controllers/features/userRoles';
import { UserChannelManager } from '@/controllers/features/userChannels';
import ModerationManager from '@/controllers/features/moderation';
import { BASE_CHANNELS } from './utils/baseChannels';

class Bot {
  config = BOT_CONFIG;
  guilds: Map<string, GuildBotContext> = new Map();
  isReady: Promise<boolean>;
  motherGuild: Discord.Guild | null = null;
  userCooldown = new Map<string, number>();

  /* Features */
  rulesManager!: RulesManager;
  userRoleManager!: UserRoleManager;
  userChannelManager!: UserChannelManager;
  moderationManager!: ModerationManager;

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

    this.rulesManager = new RulesManager();
    this.userRoleManager = new UserRoleManager();
    this.userChannelManager = new UserChannelManager();
    this.moderationManager = new ModerationManager();

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

    // Initialize user map
    const userRepository = dataProvider.user;
    await userRepository.init();

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
      await this.moderationManager.setupGuild(guild);

      await this.setupBaseChannels(guild);
    } catch (error) {
      console.error(error);
      logger.Error('Bot', (error as any).message);
    }
  }

  async setupBaseChannels(guildData: TPocketbase.GuildData) {
    const guild = getGuild(guildData.guildId);
    if (!guild) {
      logger.Warning('Bot', `Guild ${guildData.guildId} not found.`);
      return;
    }

    const channels: GuildConfigChannel[] = [];
    let channel;
    for (const { channelId, name, type } of BASE_CHANNELS) {
      channel = await this.setupChannel(guild, { name, type }, { name, type, position: channelId });
      channels.push({
        name,
        type,
        description: '',
        channelId,
        entityId: channel.id,
        parentId: channel.parentId,
      });
    }

    // Update guild data
    return await dataProvider.guild.update({
      guildId: guildData.guildId,
      channels: channels,
    });
  }

  // Idempotent function to setup a channel
  // Searches for a matching channel and creates it if it doesn't exist
  // Caller is responsible for ensuring that the parent exists
  async setupChannel(
    guild: Discord.Guild,
    identifiers: {
      name: string;
      type: Discord.ChannelType.GuildText | Discord.ChannelType.GuildCategory;
      entityId?: string;
    },
    options?: Discord.GuildChannelCreateOptions,
  ) {
    let channel: Discord.Channel | null = null;
    // Try to match entity id first
    if (identifiers.entityId) {
      channel = getGuildChannel(guild.id, identifiers.entityId) || null;
    }

    // Try to match name and type
    if (!channel) {
      channel =
        guild.channels.cache.find(
          (c) => c.name === identifiers.name && c.type === identifiers.type,
        ) || null;
    }

    // Create channel if it doesn't exist
    if (!channel) {
      logger.Debug('Bot', `Creating channel ${identifiers.name} ...`);
      channel = await createChannel<Discord.ChannelType.GuildText>(guild.id, {
        name: identifiers.name,
        type: identifiers.type,
        ...options,
      });
    }

    return channel as Discord.TextChannel | Discord.CategoryChannel;
  }

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
