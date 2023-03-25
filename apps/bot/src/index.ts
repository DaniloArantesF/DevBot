import discordClient from '@/DiscordClient';
import dataProvider from '@/DataProvider';
import taskManager from '@/TaskManager';
import { createRole, getEveryoneRole } from '@/tasks/roles';
import { API_HOSTNAME, API_PORT, BOT_CONFIG, CLIENT_URL, REDIS_URL } from 'shared/config';
import { logger } from 'shared/logger';
import { BASE_MEMBER_PERMISSIONS, POCKETBASE_BASE_URL } from './utils/config';
import api from '@/api';
import { getGuild } from './tasks/guild';
import Discord from 'discord.js';
import {
  ConfigCollection,
  GuildBotContext,
  GuildConfigChannel,
  GuildConfigExport,
  GuildConfigUserRole,
  ReactionHandler,
  TPocketbase,
} from 'shared/types';
import { createChannel, getRulesChannel } from './tasks/channels';
import { getRolesMessage } from './tasks/message';

class Bot {
  isReady: Promise<boolean>;
  userCooldown = new Map<string, number>();
  guilds: Map<string, GuildBotContext> = new Map();

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
    await taskManager.setupTaskControllers();

    await this.guildSetup();
    api.start();

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

      // Init guild context
      this.guilds.set(guild.guildId, {
        rulesChannel: null,
        rulesMessage: null,
        memberRole: null,
        rolesCategory: null,
      });

      try {
        await this.guildMemberRulesSetup(guild);
        await this.guildUserRolesSetup(guild);
      } catch (error) {
        console.error(error);
        logger.Error('Bot', (error as any).message);
      }
    }
  }

  // Make sure all roles are created
  // Update database with new roles
  async guildMemberRulesSetup(guild: TPocketbase.Guild) {
    const everyone = getEveryoneRole(guild.guildId);

    // Remove all permissions from everyone
    everyone.setPermissions([]);

    // Make sure there is a rules channel
    const rulesChannelPermissions: Discord.PermissionsString[] = [
      'ViewChannel',
      'AddReactions',
      'ReadMessageHistory',
    ];
    let rulesChannel = getRulesChannel(guild.guildId);
    if (!rulesChannel) {
      // Creates the only channel that can be viewed by non members
      rulesChannel = await createChannel<Discord.ChannelType.GuildText>(guild.guildId, {
        name: 'rules',
        type: Discord.ChannelType.GuildText,
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
        permissions: BASE_MEMBER_PERMISSIONS,
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
          logger.Debug('Bot', `Adding basic member role to ${user.id}.`);
          await member?.roles.add(memberRoleId!);
        }
      }),
    );

    this.listenRuleReactions(guild.guildId);
    logger.Debug('Bot', `Finished ${guild.guildId} rules setup.`);
  }

  async guildUserRolesSetup(guild: TPocketbase.Guild) {
    logger.Debug('Bot', `Starting ${guild.guildId} role setup.`);
    // TODO: reset all user roles when on startup?
    const guildRolesCollection = (await getGuild(guild.guildId)!.roles.fetch()).map((r) => r);

    // Make sure all roles are created, only create if they don't exist
    const newUserRoles = [...guild.userRoles] ?? [];

    // Maps role names to role
    const roleNameMap = new Map<string, Discord.Role>();
    const roleEmojiMap = new Map<string, Discord.Role>();

    for (let i = 0; i < guildRolesCollection.length; i++) {
      const role = guildRolesCollection[i];

      // Match is found by name, remove from new entries then update discord if necessary
      const matchIndex = newUserRoles.findIndex((r) => r.name === role.name);
      if (matchIndex === -1) {
        continue;
      } else {
        logger.Debug('Bot', `Found role ${role.name} in ${guild.guildId}.`);
      }
      // ${newUserRoles[matchIndex]}/
      roleNameMap.set(`${role.name}`, role);
      roleEmojiMap.set(`${newUserRoles[matchIndex].emoji}`, role);
      newUserRoles.splice(matchIndex, 1);

      // TODO: reset update role permissions
      // const toUpdate = {
      //   ...((newUserRoles[matchIndex].color && newUserRoles[matchIndex].color! !== role.color.)&& { color: newUserRoles[matchIndex].color }),
      // }
      // await role.edit({
      //   unicodeEmoji: newUserRoles[matchIndex].emoji,
      //   position: newUserRoles[matchIndex].position,
      //   // ...(newUserRoles[matchIndex].color && { color: newUserRoles[matchIndex].color }),
      // });
    }

    // Create new roles
    if (newUserRoles.length > 0) logger.Debug('Bot', `Creating ${newUserRoles.length} roles.`);
    for (const roleData of newUserRoles) {
      const randomColor = Object.keys(Discord.Colors)[
        Math.floor(Math.random() * Object.keys(Discord.Colors).length)
      ];
      const role = await createRole(guild.guildId, {
        name: roleData.name,
        color: Discord.Colors[randomColor as keyof typeof Discord.Colors],
        hoist: false,
        mentionable: true,
        permissions: BASE_MEMBER_PERMISSIONS,
        // unicodeEmoji: roleData.emoji,
      });
      roleNameMap.set(roleData.name, role!);
      roleEmojiMap.set(roleData.emoji, role!);
    }

    // Make sure reaction roles category exists
    const channels = await getGuild(guild.guildId)!.channels.fetch();
    let rolesCategory = channels.find(
      (c) => c && c.name === 'Roles' && c.type === Discord.ChannelType.GuildCategory,
    );
    if (!rolesCategory) {
      rolesCategory = await createChannel<Discord.ChannelType.GuildCategory>(guild.guildId, {
        name: 'Roles',
        type: Discord.ChannelType.GuildCategory,
        position: 0,
      });
    }
    this.guilds.get(guild.guildId)!.rolesCategory = rolesCategory as Discord.CategoryChannel;

    // For each user role category, create a reaction channel and send a message
    const categories = new Set(guild.userRoles.map((r) => r.category));
    for (const category of categories) {
      const categoryRoles = guild.userRoles
        .filter((r) => r.category === category)
        .map((r) => ({
          id: roleNameMap.get(r.name)!.id,
          emoji: r.emoji,
        }));
      let categoryChannel = channels.find(
        (c) => c && c.name === category && c.type === Discord.ChannelType.GuildText,
      ) as Discord.TextChannel;
      if (!categoryChannel) {
        logger.Debug('Bot', `Creating "${category}" role reaction channel.`);
        categoryChannel = await createChannel<Discord.ChannelType.GuildText>(guild.guildId, {
          name: category,
          type: Discord.ChannelType.GuildText,
          parent: rolesCategory!.id,
        });
      }

      let categoryMessage = (await categoryChannel.messages.fetchPinned()).first();
      const messageContent = getRolesMessage(categoryRoles);

      // Create/Update message and pin it
      if (!categoryMessage) {
        categoryMessage = await categoryChannel.send(messageContent);
        await categoryMessage.pin();
      } else {
        await categoryMessage.edit(messageContent);
      }

      // Add reactions
      for (const role of categoryRoles) {
        await categoryMessage.react(role.emoji!);
      }

      const onAdd: ReactionHandler = (reaction, user) => {
        if (user.bot) return;
        const role = roleEmojiMap.get(reaction.emoji.name ?? '');
        if (!role) return;
        const member = getGuild(guild.guildId)!.members.cache.get(user.id);
        member?.roles.add(role.id);
      };

      const onRemove: ReactionHandler = (reaction, user) => {
        if (user.bot) return;
        const role = roleEmojiMap.get(reaction.emoji.name ?? '');
        if (!role) return;
        const member = getGuild(guild.guildId)!.members.cache.get(user.id);
        member?.roles.remove(role.id);
      };

      // Make sure all members that have reacted have the proper roles
      for (const { id: roleId, emoji } of categoryRoles) {
        const role = await getGuild(guild.guildId)!.roles.fetch(roleId);
        const reaction = categoryMessage.reactions.cache.find((r) => r.emoji.name === emoji);

        await Promise.all(
          (await reaction?.users.fetch())!.map(async (user) => {
            if (user.bot) return;
            let member = getGuild(guild.guildId)?.members.cache.get(user.id);
            if (!member) {
              member = await getGuild(guild.guildId)?.members.fetch(user.id);
            }

            if (!member?.roles.cache.has(roleId)) {
              logger.Debug('Bot', `Adding "${role?.name}" to ${user.id}.`);
              await member?.roles.add(roleId);
            }
          }),
        );
      }

      // Listen for reactions
      logger.Debug('Bot', `Listening for "${category}" role reactions.`);
      this.listenMessageReactions(categoryMessage, onAdd, onRemove);
    }

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
    });

    const onAdd: ReactionHandler = (reaction, user) => {
      if (user.bot || reaction.emoji.name !== '✅') return;
      guild.members.cache.get(user.id)?.roles.add(guildContext.memberRole!.id);
    };

    const onRemove: ReactionHandler = (reaction, user) => {
      if (user.bot || reaction.emoji.name !== '✅') return;
      guild.members.cache.get(user.id)?.roles.remove(guildContext.memberRole!.id);
    };

    this.listenMessageReactions(guildContext.rulesMessage, onAdd, onRemove);
  }

  listenMessageReactions(
    message: Discord.Message,
    onAdd: ReactionHandler,
    onRemove: ReactionHandler,
  ) {
    const guild = message.guild;
    guild?.client.on('messageReactionAdd', (reaction, user) => {
      if (!(reaction.message.id === message.id && !user.bot)) return;
      onAdd(reaction, user);
    });

    guild?.client.on('messageReactionRemove', (reaction, user) => {
      if (!(reaction.message.id === message.id && !user.bot)) return;
      onRemove(reaction, user);
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
      const channel = c as Discord.GuildChannel;
      const { name, type, parent, flags, manageable } = channel;
      const channelData = {
        name,
        description: '',
        type: type.toString(), // move to actual type strings
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

      if (type === Discord.ChannelType.GuildCategory || parent === null) {
        collection[key] = channelData;
      } else {
        // Subchannel, add it to the parent
        const parentIndex = Object.keys(collection).find(
          (key) => collection[key].name === parent.name,
        );
        const parentChannel = parentIndex ? collection[parentIndex] : null;
        if (!parentChannel) {
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

  async createRulesMessage(rulesChannel: Discord.TextChannel, message: string) {
    const rulesMessage = await rulesChannel.send({ content: message });
    await rulesMessage.pin('Read these');
    return rulesMessage;
  }

  async updateRulesMessage(rulesMessage: Discord.Message, message: string) {
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
