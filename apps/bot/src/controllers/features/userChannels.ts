import dataProvider from '@/DataProvider';
import bot from '@/index';
import { createChannel, getGuildChannels } from '@/tasks/channels';
import { getEveryoneRole } from '@/tasks/roles';
import Discord from 'discord.js';
import { logger } from 'shared/logger';
import { TPocketbase } from 'shared/types';
import { getFormatedChannelName } from 'shared/utils';

export class UserChannelManager {
  constructor() {}

  async setupGuild(guild: TPocketbase.Guild) {
    logger.Debug('Bot', `Validating role channels for ${guild.guildId} ...`);
    const guildCategories = new Set(guild.userRoles.map((r) => r.category.toLowerCase()));
    const guildContext = bot.guilds.get(guild.guildId)!;
    const userChannels: TPocketbase.UserChannel[] = [];
    const everyoneRole = getEveryoneRole(guild.guildId);

    let categoryPositon = 1;
    for (const category of guildCategories) {
      // Create category if it doesn't exist
      const categoryChannelName = `${category.toLowerCase()}-chat`;
      let categoryChannel = getGuildChannels(guild.guildId)?.find(
        (c) =>
          c.name.toLowerCase() === categoryChannelName.toLowerCase() &&
          c.type === Discord.ChannelType.GuildCategory,
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
      guildContext.userChannelCategory.set(category.toLowerCase(), categoryChannel);
    }

    for (const role of guild.userRoles) {
      let userRoleChannel = getGuildChannels(guild.guildId)?.find(
        (c) =>
          c.name.toLowerCase() === getFormatedChannelName(role.name).toLowerCase() &&
          c.type === Discord.ChannelType.GuildText &&
          c.parentId === guildContext.userChannelCategory.get(role.category.toLowerCase())?.id,
      ) as Discord.TextChannel;

      const roleId = role.entityId;
      if (!userRoleChannel && roleId) {
        logger.Debug('Bot', `Creating channel for role ${role.name} in ${role.category}`);
        userRoleChannel = await createChannel<Discord.ChannelType.GuildText>(guild.guildId, {
          name: role.name.toLowerCase(),
          type: Discord.ChannelType.GuildText,
          parent: guildContext.userChannelCategory.get(role.category.toLowerCase()),
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
      guildContext.roleUserChannels.set(userRoleChannel.id, userRoleChannel);
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
  async validateSetup(guildId: string) {}

  async purgeUserChannels(guild: TPocketbase.Guild) {
    const channels = getGuildChannels(guild.guildId);
    await Promise.all(
      guild.userChannels.map(async (c) =>
        c.entityId ? await channels?.get(c.entityId)?.delete() : null,
      ),
    );

    // Delete category channels
    const categories = [...new Set(guild.userRoles.map((r) => r.category.toLowerCase())).values()];
    await Promise.all(
      categories.map(async (category) => {
        const categoryChannelName = `${category.toLowerCase()}-chat`;
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
}
