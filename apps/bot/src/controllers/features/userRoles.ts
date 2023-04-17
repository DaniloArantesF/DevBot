import { ReactionHandler, TPocketbase } from 'shared/types';
import Discord from 'discord.js';
import { listenMessageReactions } from '@/tasks/message';
import { getGuild } from '@/tasks/guild';
import bot from '@/index';
import { logger } from 'shared/logger';
import { createRole, getEveryoneRole, getGuildRole } from '@/tasks/roles';
import { createChannel, getGuildChannels } from '@/tasks/channels';
import { getFormatedChannelName } from 'shared/utils';
import dataProvider from '@/DataProvider';

export function RolesEmbed(userRoles: ({ id: string } & TPocketbase.UserRoleItem)[]) {
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

export class UserRoleManager {
  constructor() {}

  async setupGuild(guild: TPocketbase.Guild) {
    if (!bot.guilds.get(guild.guildId)) {
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
      bot.guilds.get(guild.guildId)!.userRoles.set(role.id, role);

      roleNameMap.set(`${role.name.toLowerCase()}`, role);
      bot.guilds.get(guild.guildId)!.roleEmojiMap.set(`${newUserRoles[matchIndex].emoji}`, role.id);
      newUserRoles.splice(matchIndex, 1);

      // Update role entityId in database
      const index = guild.userRoles.findIndex(
        (r) => r.name.toLowerCase() === role.name.toLowerCase(),
      );
      guild.userRoles[index].entityId = role.id;
      // TODO: sync role permissions
    }

    // Create new roles
    if (newUserRoles.length > 0 && newUserRoles.length <= 80)
      logger.Debug('Bot', `Creating ${newUserRoles.length} roles.`);
    if (newUserRoles.length > 80) {
      logger.Error('Bot', `Too many roles to create for ${guild.guildId}.`);
      return;
    }

    for (const roleData of newUserRoles) {
      const role = await this.createDiscordRole(guild.guildId, roleData.name.toLowerCase());
      if (!role) {
        logger.Error('Bot', `Failed to create role ${roleData.name} for ${guild.guildId}.`);
        continue;
      }

      roleNameMap.set(roleData.name.toLowerCase(), role);
      bot.guilds.get(guild.guildId)!.roleEmojiMap.set(roleData.emoji, role!.id);
      bot.guilds.get(guild.guildId)!.userRoles.set(role!.id, role!);

      // Update user roles in object to be saved to db
      const index = guild.userRoles.findIndex(
        (r) => r.name.toLowerCase() === roleData.name.toLowerCase(),
      );
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
    bot.guilds.get(guild.guildId)!.rolesCategory = rolesCategory as Discord.CategoryChannel;
    const everyoneRole = getEveryoneRole(guild.guildId);

    // For each user role category, create a reaction channel and send a message
    const categories = new Set(guild.userRoles.map((r) => r.category.toLowerCase()));
    for (const category of categories) {
      const categoryRoles = guild.userRoles
        .filter((r) => r.category.toLowerCase() === category.toLowerCase())
        .map((r) => ({ id: roleNameMap.get(r.name.toLowerCase())!.id, ...r }));

      // Create user role category channel if it doesn't exist
      let categoryReactionChannel = channels.find(
        (c) =>
          c &&
          getFormatedChannelName(c.name.toLowerCase()) ===
            getFormatedChannelName(category.toLowerCase()) &&
          c.type === Discord.ChannelType.GuildText,
      ) as Discord.TextChannel;

      if (!categoryReactionChannel) {
        logger.Debug('Bot', `Creating "${category}" role reaction channel.`);
        categoryReactionChannel = await createChannel<Discord.ChannelType.GuildText>(
          guild.guildId,
          {
            name: category.toLowerCase(),
            type: Discord.ChannelType.GuildText,
            parent: rolesCategory!.id,
            permissionOverwrites: [
              {
                id: everyoneRole!.id,
                deny: [Discord.PermissionsBitField.Flags.SendMessages],
              },
            ],
          },
        );
      }

      // Save user reaction channel to context
      bot.guilds
        .get(guild.guildId)!
        .reactionChannels.set(category.toLowerCase(), categoryReactionChannel);

      let isNewMessage = false;
      let categoryMessage = (await categoryReactionChannel.messages.fetchPinned()).first();
      // Create/Update message and pin it
      if (!categoryMessage) {
        isNewMessage = true;
        categoryMessage = await this.createRolesMessage(categoryReactionChannel, categoryRoles);
      } else {
        await this.updateRolesMessage(categoryMessage, categoryRoles);
      }

      // Add reactions
      await Promise.all(
        categoryRoles.map(async (role) => {
          await categoryMessage?.react(role.emoji!);
        }),
      );

      // Dont bother checking roles if this is a new message
      if (!isNewMessage) {
        // For each role in the category, check that all members who reacted have the role
        logger.Debug('Bot', `Verifying members have roles for "${category}"`);
        for (const { id: roleId, emoji } of categoryRoles) {
          const role = await getGuild(guild.guildId)!.roles.fetch(roleId);
          const reaction = categoryMessage.reactions.cache.find((r) => r.emoji.name === emoji);

          // Fallback to stored member role and ignore if it doesn't exist
          let memberRole = bot.guilds.get(guild.guildId)!.memberRole;
          if (!memberRole) {
            memberRole = getGuildRole(guild.guildId, guild.memberRoleId) || null;
          }

          await Promise.all(
            (await reaction?.users.fetch())!.map(async (user) => {
              if (user.bot) return;
              let member = getGuild(guild.guildId)?.members.cache.get(user.id);
              if (!member) {
                member = await getGuild(guild.guildId)?.members.fetch(user.id);
              }
              // Skip users who don't have the member role
              if (memberRole && !member?.roles.cache.has(memberRole?.id ?? '')) return;
              if (!member?.roles.cache.has(roleId)) {
                logger.Debug('Bot', `Adding "${role?.name}" to ${user.id}.`);
                await member?.roles.add(roleId);
              }
            }),
          );
        }
      }

      // Listen for reactions
      logger.Debug('Bot', `Listening for "${category}" role reactions.`);

      // TODO: go through reactions and re-add userRoles if they are missing
      const onAdd: ReactionHandler = (reaction, user) => {
        if (user.bot) return;
        const role = bot.guilds.get(guild.guildId)?.roleEmojiMap.get(reaction.emoji.name ?? '');
        if (!role) {
          logger.Warning('Bot', `No role found for ${reaction.emoji.name}.`);
          return;
        }

        const member = getGuild(guild.guildId)!.members.cache.get(user.id);
        member?.roles.add(role);
      };

      const onRemove: ReactionHandler = (reaction, user) => {
        if (user.bot) return;
        const role = bot.guilds.get(guild.guildId)?.roleEmojiMap.get(reaction.emoji.name ?? '');
        if (!role) return;
        const member = getGuild(guild.guildId)!.members.cache.get(user.id);
        member?.roles.remove(role);
      };

      listenMessageReactions(categoryMessage, onAdd, onRemove);
    }

    logger.Debug('Bot', `Finished ${guild.guildId} role setup.`);
  }

  async createDiscordRole(guildId: string, name: string) {
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

  async createRolesMessage(
    rolesChannel: Discord.TextChannel,
    userRoles: ({ id: string } & TPocketbase.UserRoleItem)[],
  ) {
    const rolesMessage = await rolesChannel.send({
      embeds: [RolesEmbed(userRoles)],
    });
    await rolesMessage.pin('React to these roles');
    return rolesMessage;
  }

  async updateRolesMessage(
    rolesMessage: Discord.Message,
    userRoles: ({ id: string } & TPocketbase.UserRoleItem)[],
  ) {
    rolesMessage.edit({
      embeds: [RolesEmbed(userRoles)],
    });
    return rolesMessage;
  }
  async reactToUserRoles(message: Discord.Message, roles: TPocketbase.UserRoleItem[]) {
    for (const role of roles) {
      await message.react(role.emoji);
    }
  }
  // If channel is specified, make sure it exists
  // Otherwise try to find the channel by name
  // Finally create the channel if it doesn't exist
  // TODO: call this from guildRoleSetup instead of doing it manually there
  async addUserRole(guildId: string, roleData: TPocketbase.UserRoleItem) {
    const guildContext = bot.guilds.get(guildId);
    const roleManager = getGuild(guildId)!.roles;
    const everyoneRole = getEveryoneRole(guildId);
    let guild = await dataProvider.guild.get(guildId);
    if (!guild) {
      logger.Error('Bot', `Guild ${guildId} does not exist`);
      return;
    }
    let role;

    // Check if there is a stored entityId
    if (!roleData.entityId) {
      // Try to match it with an existing role
      role = roleManager.cache.find((r) => r.name.toLowerCase() === roleData.name.toLowerCase());
    } else {
      // Get role from cache
      role = roleManager.cache.get(roleData.entityId);
      if (!role) {
        logger.Warning('Bot', `Role ${roleData.entityId} does not exist. Creating new one.`);
      }
    }

    if (!role) {
      // Create new role
      role = await this.createDiscordRole(guildId, roleData.name);
      if (!role) {
        logger.Error('Bot', 'Failed to create role');
        return;
      }
    }
    roleData.entityId = role?.id;

    // Update database if necessary
    let index = guild.userRoles.findIndex(
      (r) => r.name.toLowerCase() === roleData.name.toLowerCase(),
    );
    if (index === -1) {
      guild.userRoles.push(roleData);
    } else {
      guild.userRoles[index] = roleData;
    }

    // Add role to reaction channel
    const reactionCategory = guildContext?.rolesCategory;
    if (!reactionCategory) {
      throw new Error('Role reaction category does not exist. Please run the setup routine.');
    }

    let categoryReactionChannel = bot.guilds
      .get(guildId)
      ?.reactionChannels.get(roleData.category.toLowerCase());
    if (!categoryReactionChannel) {
      logger.Debug('Bot', `Creating "${roleData.category}" role reaction channel.`);
      categoryReactionChannel = await createChannel<Discord.ChannelType.GuildText>(guild.guildId, {
        name: roleData.category.toLowerCase(),
        type: Discord.ChannelType.GuildText,
        parent: reactionCategory!.id,
        permissionOverwrites: [
          {
            id: everyoneRole!.id,
            deny: [Discord.PermissionsBitField.Flags.SendMessages],
          },
        ],
      });
      bot.guilds
        .get(guildId)
        ?.reactionChannels.set(roleData.category.toLowerCase(), categoryReactionChannel);
    }

    let categoryMessage = (await categoryReactionChannel.messages.fetchPinned()).first();
    const categoryRoles = guild.userRoles
      .filter((r) => r.category.toLowerCase() === roleData.category.toLowerCase())
      .map((r) => ({ id: r.entityId!, ...r }));

    // Create/Update message and pin it
    if (!categoryMessage) {
      categoryMessage = await this.createRolesMessage(categoryReactionChannel, categoryRoles);
    } else {
      await this.updateRolesMessage(categoryMessage, categoryRoles);
    }

    // Add missing reaction
    await categoryMessage.react(roleData.emoji);
    bot.guilds.get(guild.guildId)?.roleEmojiMap.set(roleData.emoji, roleData.entityId!);

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

    // Make sure user channel category exists before creating channel
    const categoryChannelName = `${roleData.category.toLowerCase()}-chat`;
    if (!guildContext?.userChannelCategory.get(roleData.category.toLowerCase())) {
      const category = await createChannel<Discord.ChannelType.GuildCategory>(guildId, {
        name: categoryChannelName,
        type: Discord.ChannelType.GuildCategory,
        permissionOverwrites: memberPermissionOverwrites,
      });
      guildContext?.userChannelCategory.set(roleData.category.toLowerCase(), category);
    }

    // Get channel, create if it doesn't exist
    const channels = getGuildChannels(guildId);
    let roleUserChannel = channels?.find(
      (c) =>
        c.name.toLowerCase() === roleData.name.toLowerCase() &&
        c.type === Discord.ChannelType.GuildText,
    );
    if (!roleUserChannel) {
      roleUserChannel = await createChannel<Discord.ChannelType.GuildText>(guildId, {
        name: roleData.name.toLowerCase(),
        type: Discord.ChannelType.GuildText,
        parent: guildContext?.userChannelCategory.get(roleData.category.toLowerCase()),
        permissionOverwrites: memberPermissionOverwrites,
      })!;
    }

    guildContext?.roleUserChannels.set(roleUserChannel.id, roleUserChannel as Discord.TextChannel);

    index = guild.userChannels.findIndex(
      (c) => c.name.toLowerCase() === roleData.name.toLowerCase(),
    );
    if (index === -1) {
      guild.userChannels.push({
        entityId: roleData.entityId,
        name: roleUserChannel.name,
        type: roleUserChannel.type,
        description: '',
        allowedRoles: roleData.entityId ? [roleData.entityId] : [],
        flags: [],
        plugin: null,
        parentId:
          guildContext?.userChannelCategory.get(roleData.category.toLowerCase())?.id ?? null,
      });
      logger.Debug('Bot', `Updating database with new role ${roleData.name}`);
    }

    guild = await dataProvider.guild.update(guild);
  }
  async removeUserRole(guildId: string, roleData: TPocketbase.UserRoleItem) {}
}
