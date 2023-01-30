// Delists a user from a guild role
import { SlashCommandBuilder, Message } from 'discord.js';
import { DiscordCommand } from '@/utils/types';
import { getGuildRole, removeUserRole } from '@/tasks/roles';
import { replyInteraction } from '@/tasks/commands';

export const command: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName('delist')
    .setDescription('Delists a user from a role on this guild')
    .addRoleOption((option) =>
      option.setName('role').setDescription('The role to delist the user from').setRequired(true),
    ),
  async execute(interaction) {
    let reply = 'Error removing you from this role.';
    let role = null;
    const isMessage = interaction instanceof Message;

    if (isMessage) {
      role = interaction.mentions.roles.first();
    } else {
      role = interaction.options.get('role').role;
    }

    // Role not found
    if (!role) {
      reply = 'Inexistent or invalid role option.';
      await replyInteraction(interaction, reply);
      return;
    }

    // TODO: check if user has role
    try {
      await removeUserRole(interaction.member.user.id, interaction.guildId, role.id);
      reply = `Successfully removed you from ${role.name}`;
    } catch (error) {
      console.log(interaction);
      console.log(error);
    }

    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: (this.data.name as string) ?? '',
      args: isMessage ? [role.name] : [...interaction.options.data],
      reply: reply,
    };
  },
  usage: '/delist <role>',
  aliases: [],
};
