import discordClient from '@/DiscordClient';
import dataProvider from '@/DataProvider';
import taskManager from '@/TaskManager';
import { createRole, getEveryoneRole, setRolesMessage } from '@/tasks/roles';
import { API_HOSTNAME, API_PORT, BOT_CONFIG, CLIENT_URL, REDIS_URL } from 'shared/config';
import { logger } from 'shared/logger';
import { POCKETBASE_BASE_URL } from './utils/config';
import api from '@/api';
import { getGuild } from './tasks/guild';
import {
  GuildChannel,
  ChannelType,
  PermissionsString,
  TextChannel,
  Message,
  MessageReaction,
  User,
  Role,
} from 'discord.js';
import {
  ConfigCollection,
  GuildBotContext,
  GuildConfigChannel,
  GuildConfigExport,
  GuildConfigUserRole,
  TPocketbase,
} from 'shared/types';
import { createChannel, getRulesChannel } from './tasks/channels';

class Bot {
  isReady: Promise<boolean>;
  userCooldown = new Map<string, number>();
  guilds: Map<string, GuildBotContext> = new Map();

  baseMemberPermissions: PermissionsString[] = [
    'CreateInstantInvite',
    'AddReactions',
    'Stream',
    'ViewChannel',
    'SendMessages',
    'SendTTSMessages',
    'EmbedLinks',
    'AttachFiles',
    'ReadMessageHistory',
    'MentionEveryone',
    'UseExternalEmojis',
    'Connect',
    'Speak',
    'UseVAD',
    'ChangeNickname',
    'UseApplicationCommands',
    'RequestToSpeak',
    'CreatePublicThreads',
    'CreatePrivateThreads',
    'UseExternalStickers',
    'SendMessagesInThreads',
    'UseEmbeddedActivities',
  ];

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
    return new Promise<boolean>((resolve, reject) => {
      // Setup
      discordClient.on('ready', async () => {
        try {
          await dataProvider.connect();
          this.main();
          resolve(true);
        } catch (error) {
          console.info(error);
          reject(false);
          this.shutdown();
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
      if (guild.guildId !== '817654492782657566') continue;
      try {
        this.guildRoleSetup(guild);
      } catch (error) {
        console.error(error);
        logger.Error('Bot', (error as any).message);
      }
    }
  }

  // Make sure all roles are created
  // Update database with new roles
  async guildRoleSetup(guild: TPocketbase.Guild) {
    this.guilds.set(guild.guildId, {
      rulesChannel: null,
      rulesMessage: null,
      memberRole: null,
    });
    const everyone = getEveryoneRole(guild.guildId);

    // Remove all permissions from everyone
    everyone.setPermissions([]);

    // Make sure there is a rules channel
    const rulesChannelPermissions: PermissionsString[] = [
      'ViewChannel',
      'AddReactions',
      'ReadMessageHistory',
    ];
    let rulesChannel = getRulesChannel(guild.guildId);
    if (!rulesChannel) {
      // Creates the only channel that can be viewed by non members
      rulesChannel = await createChannel<ChannelType.GuildText>(guild.guildId, {
        name: 'rules',
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: everyone.id,
            allow: rulesChannelPermissions,
          },
        ],
      });

      logger.Debug('Bot', `Created ${guild.guildId} rules channel.`);
      await getGuild(guild.guildId)!.setRulesChannel(rulesChannel);
    } else {
      // Validate rules channel permission
      await rulesChannel.permissionOverwrites.edit(everyone, {
        ViewChannel: true,
        AddReactions: true,
        ReadMessageHistory: true,
      });
    }

    // Validate and update rules message
    let rulesMessage = (await rulesChannel.messages.fetchPinned()).first();
    if (!rulesMessage) {
      rulesMessage = await this.createRulesMessage(rulesChannel, guild.rules ?? '');
    } else {
      await this.updateRulesMessage(rulesMessage, guild.rules ?? '');
    }
    await rulesMessage.react('✅');
    this.guilds.get(guild.guildId)!.rulesMessage = rulesMessage;
    this.guilds.get(guild.guildId)!.rulesChannel = rulesChannel;

    // Basic member role (given when users react to rules)
    let memberRoleId = guild.memberRoleId;
    if (!memberRoleId || !getGuild(guild.guildId)?.roles.cache.has(memberRoleId)) {
      logger.Debug('Bot', `Creating ${guild.guildId} member role.`);
      const memberRole = await createRole(guild.guildId, {
        name: 'Member',
        color: 'Green',
        hoist: false,
        mentionable: false,
        permissions: this.baseMemberPermissions,
      });
      this.guilds.get(guild.guildId)!.memberRole = memberRole ?? null;

      // Save the member role id
      guild.memberRoleId = memberRole!.id;
      memberRoleId = memberRole!.id;
      dataProvider.guild.update(guild); // maybe update cache?
    }
    this.guilds.get(guild.guildId)!.memberRole =
      getGuild(guild.guildId)?.roles.cache.get(memberRoleId!) ?? null;

    // Make sure all users that have reacted have the member role
    const reaction = (await rulesMessage!.fetch(true)).reactions.cache.find(
      (r) => r.emoji.name === '✅',
    );
    await Promise.all(
      (await reaction?.users.fetch())!.map(async (user) => {
        if (user.bot) return;
        const member = await getGuild(guild.guildId)?.members.fetch(user.id);
        if (!member?.roles.cache.has(memberRoleId!)) {
          logger.Debug('Bot', `Adding member role to ${user.id}.`);
          await member?.roles.add(memberRoleId!);
        }
      }),
    );

    this.listenRuleReactions(guild.guildId);

    // TODO: continue and add user roles / channels
    logger.Debug('Bot', `Finished ${guild.guildId} role setup.`);
  }

  async listenRuleReactions(guildId: string) {
    const guildContext = this.guilds.get(guildId);
    if (!guildContext?.rulesMessage || !guildContext.memberRole) {
      logger.Error('Bot', 'Invalid guild context');
      return;
    }

    const guild = getGuild(guildId)!;
    guild.client.on('messageReactionAdd', (reaction, user) => {
      if (!(reaction.emoji.name === '✅' && !user.bot)) return;
      guild.members.cache.get(user.id)?.roles.add(guildContext.memberRole!.id);
    });
    guild.client.on('messageReactionRemove', (reaction, user) => {
      if (!(reaction.emoji.name === '✅' && !user.bot)) return;
      guild.members.cache.get(user.id)?.roles.remove(guildContext.memberRole!.id);
    });
  }

  // Gets the current channels
  // Returns the configuration object or null on error
  async exportGuildConfig(guildId: string): Promise<GuildConfigExport | null> {
    const guild = await getGuild(guildId);
    if (!guild) {
      return null;
    }

    // Gets all the current roles, excluding just @everyone
    const guildRoles = guild.roles.cache.reduce(
      (
        collection,
        { color, hoist, icon, mentionable, name, permissions, unicodeEmoji, managed, ...role },
        key,
      ) => {
        if (role.id === guild.roles.everyone.id) {
          return collection;
        }
        collection[key] = {
          color,
          hoist,
          icon,
          mentionable,
          name,
          permissions: permissions.toArray(),
          unicodeEmoji,
          managed: managed,
          userAssignable: !permissions.has('Administrator'),
        };
        return collection;
      },
      {} as ConfigCollection<GuildConfigUserRole>,
    );

    const guildChannels = guild.channels.cache.reduce((collection, c, key) => {
      const channel = c as GuildChannel;
      const { name, type, parent, flags, manageable } = channel;
      const channelData = {
        name,
        description: '',
        type: type.toString(), // improve this
        subChannels: {},
        allowedRoles: [
          ...guild.roles.cache
            .filter((role) => channel.permissionsFor(role).has('ViewChannel'))
            .map((role) => role.id),
        ],
        moderation: {
          language: {
            enabled: false,
            allowed: [],
            roleExceptions: [],
          },
          content: {
            enabled: false,
            allowed: [],
            roleExceptions: [],
          },
        },
        manageable,
        flags: flags.toArray(),
        plugin: null,
      };

      if (type === ChannelType.GuildCategory || parent === null) {
        collection[key] = channelData;
      } else {
        // Subchannel, add it to the parent
        const parentIndex = Object.keys(collection).find(
          (key) => collection[key].name === parent.name,
        );
        const parentChannel = parentIndex ? collection[parentIndex] : null;
        if (!parentChannel) {
          console.error('Parent channel not found!!');
          return collection;
        }
        parentChannel.subChannels[key] = channelData;
      }

      return collection;
    }, {} as ConfigCollection<GuildConfigChannel>);

    return {
      roles: guildRoles,
      rules: {
        channelName: guild.rulesChannel?.name || 'rules',
        message: 'Please read the rules before chatting', // TODO,
        // role: ... // TODO
      },
      channels: guildChannels,
      plugins: [],
    };
  }

  async createRulesMessage(rulesChannel: TextChannel, message: string) {
    const rulesMessage = await rulesChannel.send({ content: message });
    await rulesMessage.pin('Read these');
    return rulesMessage;
  }

  async updateRulesMessage(rulesMessage: Message, message: string) {
    rulesMessage.edit({ content: message });
    return rulesMessage;
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
