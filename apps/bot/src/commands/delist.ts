// Delists a user from a guild role
import { SlashCommandBuilder, Message } from 'discord.js';
import { TBot } from '@/utils/types';
import { getGuildRole, removeUserRole } from '@/tasks/roles';
import { replyInteraction } from '@/tasks/commands';

export const command: TBot.Command = {
  isHidden: true,
  data: new SlashCommandBuilder()
    .setName('delist')
    .setDescription('Delists a user from a role on this guild')
    .addRoleOption((option) =>
      option.setName('role').setDescription('The role to delist the user from').setRequired(true),
    ),
  async messageHandler(interaction) {
    let reply = 'Error removing you from this role.';
    const role = interaction.mentions.roles.first();

    // Role not found
    if (!role) {
      reply = 'Inexistent or invalid role option.';
      await replyInteraction(interaction, reply);
      return;
    }

    try {
      await removeUserRole(interaction.member!.user.id, interaction.guildId!!, role.id);
      reply = `Successfully removed you from ${role.name}`;
    } catch (error) {
      console.log(interaction);
      console.log(error);
    }

    await replyInteraction(interaction, reply);

    return {
      user: interaction.member!.user.id,
      guild: interaction.guildId!,
      channel: interaction.channelId,
      command: 'enlist',
      args: [role.name],
      reply: reply,
    };
  },
  async execute(interaction) {
    let reply = 'Error removing you from this role.';
    let role = interaction.options.get('role')!.role;

    // Role not found
    if (!role) {
      reply = 'Inexistent or invalid role option.';
      await replyInteraction(interaction, reply);
      return;
    }

    // TODO: check if user has role
    try {
      await removeUserRole(interaction.member!.user.id, interaction.guildId!!, role.id);
      reply = `Successfully removed you from ${role.name}`;
    } catch (error) {
      console.log(interaction);
      console.log(error);
    }

    await replyInteraction(interaction, reply);

    return {
      user: interaction.member!.user.id,
      guild: interaction.guildId!,
      channel: interaction.channelId,
      command: (this.data.name as string) ?? '',
      args: [...interaction.options.data],
      reply: reply,
    };
  },
  usage: '/delist <role>',
  aliases: [],
};
