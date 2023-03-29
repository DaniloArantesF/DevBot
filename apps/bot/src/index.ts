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
import {
  createChannel,
  getGuildChannels,
  getRulesChannel,
  listenMessageReactions,
} from './tasks/channels';
import moderation from './controllers/features/moderation';
import { getFormatedChannelName } from 'shared/utils';

class Bot {
  isReady: Promise<boolean>;
  userCooldown = new Map<string, number>();
  guilds: Map<string, GuildBotContext> = new Map();
  globalModerationConfig = {
    language: {
      enabled: true,
      allowed: ['en'],
      roleExceptions: [],
    },
    content: {
      enabled: false,
      allowed: [],
      roleExceptions: [],
    },
  };

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

    if (BOT_CONFIG.autoProcess) {
      await taskManager.initProcessing();
    }
    // await taskManager.setupPlugins();
  }

  // Guild setup checks
  // Create guilds in database if they don't exist
  // Add/Update roles message
  async guildSetup() {
    const guildRepository = dataProvider.guild;
    await guildRepository.init(discordClient.guilds.cache.map((guild) => guild));

    // Setup moderation module
    // await moderation.setup();

    const guilds = await guildRepository.getAll();
    for (const guild of guilds) {
      if (guild.guildId !== '817654492782657566') continue;

      // Init guild context
      this.guilds.set(guild.guildId, {
        rulesChannel: null,
        rulesMessage: null,
        memberRole: null,
        rolesCategory: null,
        roleChannels: new Map(),
        userRoles: new Map(),
        moderationConfig: { ...this.globalModerationConfig },
        categoryChannels: new Map(),
        reactionChannels: new Map(),
        roleEmojiMap: new Map(),
      });

      try {
        await this.guildMemberRulesSetup(guild);
        await this.guildUserRolesSetup(guild);
        // await this.guildModerationSetup(guild);
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
            deny: [Discord.PermissionsBitField.Flags.SendMessages],
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
      guild = await dataProvider.guild.update(guild); // maybe update cache? no await?
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
    if (!this.guilds.get(guild.guildId)) {
      logger.Error('Bot', `Guild ${guild.guildId} is not initialized.`);
      return;
    }

    logger.Debug('Bot', `Starting ${guild.guildId} role setup.`);
    const guildRolesCollection = (await getGuild(guild.guildId)!.roles.fetch()).map((r) => r);

    // Make sure all roles are created, only create if they don't exist
    const newUserRoles = [...guild.userRoles] ?? [];

    // Maps role names to role
    const roleNameMap = new Map<string, Discord.Role>();

    // Iterate over current guild roles and remove existing ones from new entries
    for (let i = 0; i < guildRolesCollection.length; i++) {
      const role = guildRolesCollection[i];

      // Match is found by name, remove from new entries then update discord if necessary
      const matchIndex = newUserRoles.findIndex(
        (r) => r.name.toLowerCase() === role.name.toLowerCase(),
      );
      if (matchIndex === -1) {
        continue;
      }

      // Save role to context
      this.guilds.get(guild.guildId)!.userRoles.set(role.id, role);

      roleNameMap.set(`${role.name}`, role);
      this.guilds
        .get(guild.guildId)!
        .roleEmojiMap.set(`${newUserRoles[matchIndex].emoji}`, role.id);
      newUserRoles.splice(matchIndex, 1);

      // Update role entityId in database
      const index = guild.userRoles.findIndex(
        (r) => r.name.toLowerCase() === role.name.toLowerCase(),
      );
      guild.userRoles[index].entityId = role.id;
      // TODO: sync role permissions
    }

    // Create new roles
    if (newUserRoles.length > 0) logger.Debug('Bot', `Creating ${newUserRoles.length} roles.`);
    for (const roleData of newUserRoles) {
      const role = await this.createUserDiscordRole(guild.guildId, roleData.name);
      if (!role) {
        logger.Error('Bot', `Failed to create role ${roleData.name} for ${guild.guildId}.`);
        continue;
      }

      roleNameMap.set(roleData.name, role);
      this.guilds.get(guild.guildId)!.roleEmojiMap.set(roleData.emoji, role!.id);
      this.guilds.get(guild.guildId)!.userRoles.set(role!.id, role!);

      // Update user roles in object to be saved to db
      const index = guild.userRoles.findIndex((r) => r.name === roleData.name);
      guild.userRoles[index].entityId = role!.id;
    }

    // Save new role ids update db
    guild = await dataProvider.guild.update({
      guildId: guild.guildId,
      userRoles: guild.userRoles,
    });

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
    const everyoneRole = getEveryoneRole(guild.guildId);

    // For each user role category, create a reaction channel and send a message
    const categories = new Set(guild.userRoles.map((r) => r.category));
    for (const category of categories) {
      const categoryRoles = guild.userRoles
        .filter((r) => r.category === category)
        .map((r) => ({ id: roleNameMap.get(r.name)!.id, ...r }));

      // Create user role category channel if it doesn't exist
      let categoryChannel = channels.find(
        (c) =>
          c &&
          c.name.toLowerCase() === category.toLowerCase() &&
          c.type === Discord.ChannelType.GuildText,
      ) as Discord.TextChannel;
      if (!categoryChannel) {
        logger.Debug('Bot', `Creating "${category}" role reaction channel.`);
        categoryChannel = await createChannel<Discord.ChannelType.GuildText>(guild.guildId, {
          name: category.toLowerCase(),
          type: Discord.ChannelType.GuildText,
          parent: rolesCategory!.id,
          permissionOverwrites: [
            {
              id: everyoneRole!.id,
              deny: [Discord.PermissionsBitField.Flags.SendMessages],
            },
          ],
        });
      }

      // Save user reaction channel to context
      this.guilds.get(guild.guildId)!.reactionChannels.set(category, categoryChannel);

      let categoryMessage = (await categoryChannel.messages.fetchPinned()).first();
      // Create/Update message and pin it
      if (!categoryMessage) {
        categoryMessage = await this.createRolesMessage(categoryChannel, categoryRoles);
      } else {
        await this.updateRolesMessage(categoryMessage, categoryRoles);
      }

      // Add reactions
      await Promise.all(
        categoryRoles.map(async (role) => {
          await categoryMessage?.react(role.emoji!);
        }),
      );

      // For each role in the category, check that all members who reacted have the role
      logger.Debug('Bot', `Verifying members have roles for "${category}"`);
      for (const { id: roleId, emoji } of categoryRoles) {
        const role = await getGuild(guild.guildId)!.roles.fetch(roleId);
        const reaction = categoryMessage.reactions.cache.find((r) => r.emoji.name === emoji);
        const memberRole = this.guilds.get(guild.guildId)!.memberRole;
        await Promise.all(
          (await reaction?.users.fetch())!.map(async (user) => {
            if (user.bot) return;
            let member = getGuild(guild.guildId)?.members.cache.get(user.id);
            if (!member) {
              member = await getGuild(guild.guildId)?.members.fetch(user.id);
            }
            // Skip users who don't have the member role
            if (!member?.roles.cache.has(memberRole?.id ?? '')) return;
            if (!member?.roles.cache.has(roleId)) {
              logger.Debug('Bot', `Adding "${role?.name}" to ${user.id}.`);
              await member?.roles.add(roleId);
            }
          }),
        );
      }

      // Listen for reactions
      logger.Debug('Bot', `Listening for "${category}" role reactions.`);

      // TODO: go through reactions and re-add userRoles if they are missing
      const onAdd: ReactionHandler = (reaction, user) => {
        if (user.bot) return;
        const role = this.guilds.get(guild.guildId)?.roleEmojiMap.get(reaction.emoji.name ?? '');
        if (!role) {
          logger.Warning('Bot', `No role found for ${reaction.emoji.name}.`);
          return;
        }

        const member = getGuild(guild.guildId)!.members.cache.get(user.id);
        member?.roles.add(role);
      };

      const onRemove: ReactionHandler = (reaction, user) => {
        if (user.bot) return;
        const role = this.guilds.get(guild.guildId)?.roleEmojiMap.get(reaction.emoji.name ?? '');
        if (!role) return;
        const member = getGuild(guild.guildId)!.members.cache.get(user.id);
        member?.roles.remove(role);
      };

      listenMessageReactions(categoryMessage, onAdd, onRemove);
    }

    await this.createRoleChatChannels(guild);
    logger.Debug('Bot', `Finished ${guild.guildId} role setup.`);
  }

  async createUserDiscordRole(guildId: string, name: string) {
    const randomColor = Object.keys(Discord.Colors)[
      Math.floor(Math.random() * Object.keys(Discord.Colors).length)
    ];
    return await createRole(guildId, {
      name: name,
      color: Discord.Colors[randomColor as keyof typeof Discord.Colors],
      hoist: false,
      mentionable: true,
      permissions: [],
    });
  }

  // If channel is specified, make sure it exists
  // Otherwise try to find the channel by name
  // Finally create the channel if it doesn't exist
  async addUserRole(guildId: string, roleData: TPocketbase.UserRoleItem) {
    const guildContext = this.guilds.get(guildId);
    const roleManager = getGuild(guildId)!.roles;
    const everyoneRole = getEveryoneRole(guildId);
    let role;

    if (!roleData.entityId) {
      role = roleManager.cache.find((r) => r.name.toLowerCase() === roleData.name.toUpperCase());
      if (!role) {
        role = await this.createUserDiscordRole(guildId, roleData.name);
      }
      roleData.entityId = role!.id;
    } else {
      role = roleManager.cache.get(roleData.entityId);
      if (!role) {
        logger.Warning('Bot', `Role ${roleData.entityId} does not exist. Creating new one.`);
        role = await this.createUserDiscordRole(guildId, roleData.name);
      }
    }

    if (!role) logger.Error('Bot', 'Failed to create role');

    // Make sure channel exists
    const channels = getGuildChannels(guildId);
    let roleChannel = channels?.find(
      (c) =>
        c.name.toLowerCase() === roleData.name.toLowerCase() &&
        c.type === Discord.ChannelType.GuildText,
    );

    const memberPermissionOverwrites: Discord.OverwriteResolvable[] = [
      {
        id: everyoneRole.id,
        deny: [
          Discord.PermissionsBitField.Flags.ViewChannel,
          Discord.PermissionsBitField.Flags.SendMessages,
          Discord.PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
      {
        id: role!.id,
        allow: [
          Discord.PermissionsBitField.Flags.ViewChannel,
          Discord.PermissionsBitField.Flags.SendMessages,
          Discord.PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
    ];

    // Make sure category exists
    if (!guildContext?.categoryChannels.get(roleData.category)) {
      const category = await createChannel<Discord.ChannelType.GuildCategory>(guildId, {
        name: roleData.category,
        type: Discord.ChannelType.GuildCategory,
        permissionOverwrites: memberPermissionOverwrites,
      });
      guildContext?.categoryChannels.set(roleData.category, category);
    }

    if (!roleChannel) {
      roleChannel = await createChannel<Discord.ChannelType.GuildText>(guildId, {
        name: roleData.name,
        type: Discord.ChannelType.GuildText,
        parent: guildContext?.categoryChannels.get(roleData.category),
        permissionOverwrites: memberPermissionOverwrites,
      })!;
      // Update guild context
      // remove old channel if it exists ?
    }

    guildContext?.roleChannels.set(roleChannel.id, roleChannel as Discord.TextChannel);

    // Update database if necessary
    let guild = await dataProvider.guild.get(guildId);
    if (!guild) {
      logger.Error('Bot', `Guild ${guildId} does not exist`);
      return;
    }

    let index = guild.userRoles.findIndex((r) => r.name === roleData.name.toLowerCase());
    if (index === -1) {
      guild.userRoles.push(roleData);
    } else {
      guild.userRoles[index] = roleData;
    }

    index = guild.userChannels.findIndex((c) => c.name === roleData.name.toLowerCase());
    if (index === -1) {
      guild.userChannels.push({
        entityId: roleData.entityId,
        name: roleChannel.name,
        type: roleChannel.type.toString(),
        description: '',
        allowedRoles: roleData.entityId ? [roleData.entityId] : [],
        flags: [],
        plugin: null,
        parentId: guildContext?.categoryChannels.get(roleData.category)?.id ?? null,
      });
      logger.Debug('Bot', `Updating database with new role ${roleData.name}`);
      guild = await dataProvider.guild.update(guild);
    }

    // Update message
    const categoryChannel = this.guilds.get(guild.guildId)!.reactionChannels.get(roleData.category);

    if (!categoryChannel) {
      logger.Error('Bot', `Category channel ${roleData.category} does not exist`);
      return;
    }

    let categoryMessage = (await categoryChannel.messages.fetchPinned()).first();
    const categoryRoles = guild.userRoles
      .filter((r) => r.category === roleData.category)
      .map((r) => ({ id: r.entityId!, ...r }));

    // Create/Update message and pin it
    if (!categoryMessage) {
      categoryMessage = await this.createRolesMessage(categoryChannel, categoryRoles);
    } else {
      await this.updateRolesMessage(categoryMessage, categoryRoles);
    }

    await categoryMessage.react(roleData.emoji);
    this.guilds.get(guild.guildId)?.roleEmojiMap.set(roleData.emoji, roleData.entityId!);
  }

  async removeUserRole(guildId: string, roleData: TPocketbase.UserRoleItem) {}

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

    // Removes the member role and all other user roles from the user
    const onRemove: ReactionHandler = (reaction, user) => {
      if (user.bot || reaction.emoji.name !== '✅') return;
      const roles = [guildContext.memberRole!, ...guildContext.userRoles.values()];
      guild.members.cache.get(user.id)?.roles.remove(roles);
    };

    listenMessageReactions(guildContext.rulesMessage, onAdd, onRemove);
  }

  async guildModerationSetup(guild: TPocketbase.Guild) {
    const channels = getGuildChannels(guild.guildId)?.map((c) => c) ?? [];
    const moderationConfig = this.guilds.get(guild.guildId)?.moderationConfig;
    for (const channel of channels) {
      if (channel.type !== Discord.ChannelType.GuildText) continue;
      await moderation.addChannel(channel, {
        ...moderationConfig,
      });
    }
  }

  async purgeUserRoles(guild: TPocketbase.Guild) {
    const rolesManager = getGuild(guild.guildId)!.roles;
    const roles = await rolesManager.fetch();
    const roleNames = guild.userRoles.map((r) => r.name);

    await Promise.all(
      roles.map(async (role) => {
        if (role.name === '@everyone') {
          return;
        }
        if (roleNames.includes(role.name)) {
          try {
            logger.Debug('Bot', `Deleting role ${role.name}`);
            await role.delete();
          } catch (error) {
            logger.Error('Bot', `Failed to delete role ${role.name}: ${error}`);
          }
        }
      }),
    );

    // Remove entity ids from database
    guild.userRoles.forEach((r) => (r.entityId = undefined));
    await dataProvider.guild.update(guild);
  }

  async resetServerConfig(guild: TPocketbase.Guild) {}

  async purgeUserChannels(guild: TPocketbase.Guild) {
    const channels = getGuildChannels(guild.guildId);
    await Promise.all(
      guild.userChannels.map(async (c) =>
        c.entityId ? await channels?.get(c.entityId)?.delete() : null,
      ),
    );

    // Delete category channels
    const categories = [...new Set(guild.userRoles.map((r) => r.category)).values()];
    await Promise.all(
      categories.map(async (category) => {
        const categoryChannelName = `${category}-chat`;
        const categoryChannel = channels?.find(
          (c) => c.name === categoryChannelName && c.type === Discord.ChannelType.GuildCategory,
        );
        if (categoryChannel) {
          await categoryChannel.delete();
        }
      }),
    );

    // Remove entity ids from database
    guild.userChannels.forEach((c) => (c.entityId = undefined));
    await dataProvider.guild.update(guild);
  }

  async createRoleChatChannels(guild: TPocketbase.Guild) {
    logger.Debug('Bot', `Validating role channels for ${guild.guildId} ...`);
    const guildCategories = new Set(guild.userRoles.map((r) => r.category));
    const guildContext = this.guilds.get(guild.guildId)!;
    const userChannels: TPocketbase.UserChannel[] = [];
    const everyoneRole = getEveryoneRole(guild.guildId);

    let categoryPositon = 1;
    for (const category of guildCategories) {
      // Create category if it doesn't exist
      const categoryChannelName = `${category}-chat`;
      let categoryChannel = getGuildChannels(guild.guildId)?.find(
        (c) => c.name === categoryChannelName && c.type === Discord.ChannelType.GuildCategory,
      ) as Discord.CategoryChannel;
      if (!categoryChannel) {
        categoryChannel = await createChannel<Discord.ChannelType.GuildCategory>(guild.guildId, {
          name: categoryChannelName,
          type: Discord.ChannelType.GuildCategory,
          position: categoryPositon++,
        });
      }

      if (!categoryChannel) {
        logger.Error('Bot', `Failed to create category channel for "${category}" category`);
        return;
      }
      guildContext.categoryChannels.set(category, categoryChannel);
    }

    for (const role of guild.userRoles) {
      let userRoleChannel = getGuildChannels(guild.guildId)?.find(
        (c) =>
          c.name === getFormatedChannelName(role.name) &&
          c.type === Discord.ChannelType.GuildText &&
          c.parentId === guildContext.categoryChannels.get(role.category)?.id,
      ) as Discord.TextChannel;

      const roleId = role.entityId;
      if (!userRoleChannel && roleId) {
        logger.Debug('Bot', `Creating channel for role ${role.name} in ${role.category}`);
        userRoleChannel = await createChannel<Discord.ChannelType.GuildText>(guild.guildId, {
          name: role.name,
          type: Discord.ChannelType.GuildText,
          parent: guildContext.categoryChannels.get(role.category),
          permissionOverwrites: [
            {
              id: everyoneRole.id,
              deny: [
                Discord.PermissionsBitField.Flags.ViewChannel,
                Discord.PermissionsBitField.Flags.SendMessages,
                Discord.PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
            {
              id: role.entityId!,
              allow: [
                Discord.PermissionsBitField.Flags.ViewChannel,
                Discord.PermissionsBitField.Flags.SendMessages,
                Discord.PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        })!;
      }

      // Save channel to context
      guildContext.roleChannels.set(userRoleChannel.id, userRoleChannel);
      userChannels.push({
        entityId: userRoleChannel.id,
        name: userRoleChannel.name,
        type: userRoleChannel.type.toString(),
        description: '',
        allowedRoles: role.entityId ? [role.entityId] : [],
        flags: [],
        plugin: null,
        parentId: userRoleChannel.parentId,
      });
    }

    guild = await dataProvider.guild.update({
      guildId: guild.guildId,
      userChannels,
    });
    logger.Debug('Bot', `Updated user channels in database.`);
  }

  // Gets the current channels
  // Returns the configuration object or null on error
  async exportGuildConfig(guildId: string): Promise<GuildConfigExport | null> {
    const guild = getGuild(guildId);
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
    const rulesMessage = await rulesChannel.send({ embeds: [this.createRulesEmbed(message)] });
    await rulesMessage.pin('Read these rules before chatting');
    return rulesMessage;
  }

  async updateRulesMessage(rulesMessage: Discord.Message, message: string) {
    rulesMessage.edit({
      embeds: [this.createRulesEmbed(message)],
    });
    return rulesMessage;
  }

  async createRolesMessage(
    rolesChannel: Discord.TextChannel,
    userRoles: ({ id: string } & TPocketbase.UserRoleItem)[],
  ) {
    const rolesMessage = await rolesChannel.send({
      embeds: [this.createRolesEmbed(userRoles)],
    });
    await rolesMessage.pin('React to these roles');
    return rolesMessage;
  }

  async updateRolesMessage(
    rolesMessage: Discord.Message,
    userRoles: ({ id: string } & TPocketbase.UserRoleItem)[],
  ) {
    rolesMessage.edit({
      embeds: [this.createRolesEmbed(userRoles)],
    });
    return rolesMessage;
  }

  createRolesEmbed(userRoles: ({ id: string } & TPocketbase.UserRoleItem)[]) {
    const fields = userRoles.map((role) => ({
      name: `${role.emoji} ${role.description}`,
      value: Discord.roleMention(role.id),
      inline: true,
    }));
    return new Discord.EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`React to get your roles!`)
      .setDescription('You can toggle these roles by clicking the buttons below.')
      .addFields(fields);
  }

  createRulesEmbed(message: string) {
    return new Discord.EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`Read the rules before chatting!`)
      .setDescription(`React to the ✅ to get access to the rest of the server.\n${message}`);
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
