import bot from '@/index';
import { getGuild } from '@/tasks/guild';
import { listenMessageReactions } from '@/tasks/message';
import { logger } from 'shared/logger';
import { ReactionHandler, TPocketbase } from 'shared/types';
import Discord from 'discord.js';
import TextRegistry from '@/TextRegistry';
import { createRole, getEveryoneRole } from '@/tasks/roles';
import { createChannel, getRulesChannel } from '@/tasks/channels';
import { BASE_MEMBER_PERMISSIONS } from '@/utils/config';
import dataProvider from '@/DataProvider';

export function RulesEmbed(message: string) {
  return new Discord.EmbedBuilder()
    .setColor('#ff0000')
    .setTitle(`Read the rules before chatting!`)
    .setDescription(TextRegistry.messages.rulesMessage(message));
}

export class RulesManager {
  constructor() {}

  // Make sure all roles are created
  // Update database with new roles
  async setupGuild(guild: TPocketbase.Guild) {
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

    bot.guilds.get(guild.guildId)!.rulesMessage = rulesMessage;
    bot.guilds.get(guild.guildId)!.rulesChannel = rulesChannel;

    // Basic member role (given when users react to rules)
    let memberRoleId = guild.memberRoleId;
    let memberRole = memberRoleId ? getGuild(guild.guildId)?.roles.cache.get(memberRoleId) : null;
    if (!memberRoleId || !memberRole) {
      // Check that exists a role that matches the name
      let memberRole = getGuild(guild.guildId)?.roles.cache.find(
        (r) => r.name.toLowerCase() === 'Member'.toLowerCase(),
      );
      if (!memberRole) {
        logger.Debug('Bot', `Creating ${guild.guildId} member role.`);
        memberRole = await createRole(guild.guildId, {
          name: 'Member',
          color: 'Green',
          hoist: false,
          mentionable: false,
          permissions: BASE_MEMBER_PERMISSIONS,
        });
      } else {
        // Reset permissions
        await memberRole.setPermissions(BASE_MEMBER_PERMISSIONS);
      }

      // Save the member role id
      guild.memberRoleId = memberRole!.id;
      memberRoleId = memberRole!.id;

      bot.guilds.get(guild.guildId)!.memberRole = memberRole || null;
      guild = await dataProvider.guild.update(guild); // maybe update cache? no await?
    }

    if (!bot.guilds.get(guild.guildId)!.memberRole) {
      bot.guilds.get(guild.guildId)!.memberRole = memberRole || null;
    }

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

  async listenRuleReactions(guildId: string) {
    const guildContext = bot.guilds.get(guildId);
    if (!guildContext?.rulesMessage || !guildContext.memberRole) {
      logger.Error('Bot', 'Invalid guild context');
      return;
    }

    const guild = getGuild(guildId)!;
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

  async createRulesMessage(rulesChannel: Discord.TextChannel, message: string) {
    const rulesMessage = await rulesChannel.send({ embeds: [RulesEmbed(message)] });
    await rulesMessage.pin(TextRegistry.messages.rulesPinMessage);
    return rulesMessage;
  }

  async updateRulesMessage(rulesMessage: Discord.Message, message: string) {
    rulesMessage.edit({
      embeds: [RulesEmbed(message)],
    });
    return rulesMessage;
  }
}
