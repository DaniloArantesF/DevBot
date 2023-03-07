// Enlists a user into a guild role
import { SlashCommandBuilder, Message } from 'discord.js';
import { TBot } from '@utils/types';
import { addUserRole, getGuildRole, getUserRoles, removeUserRole } from '@/tasks/roles';
import { replyInteraction } from '@/tasks/commands';

export const command: TBot.Command = {
  data: new SlashCommandBuilder()
    .setName('enlist')
    .setDescription('Enlists a user into a role on this guild')
    .addRoleOption((option) =>
      option.setName('role').setDescription('The role to enlist the user into').setRequired(true),
    ),
  async buttonHandler(interaction) {
    let reply = 'Error adding you to this role.';
    const roleId = interaction.customId.split(':')[1];
    const role = await getGuildRole(interaction.guildId!!, roleId);
    if (!role) return;
    // TODO: make sure user's role is at least the same as the role they're trying to enlist into
    try {
      const userRoles = await getUserRoles(interaction.member!.user.id, interaction.guildId!!);
      if (userRoles && userRoles.get(role.id)) {
        await removeUserRole(interaction.member!.user.id, interaction.guildId!!, role.id);
        reply = `Successfully removed you from ${role.name}`;
      } else {
        await addUserRole(interaction.member!.user.id, interaction.guildId!!, role.id);
        reply = `Successfully added you to ${role.name}`;
      }
    } catch (error) {
      console.log(error);
    }

    await interaction.deleteReply();

    return {
      user: interaction.member!.user.id,
      guild: interaction.guildId!,
      channel: interaction.channelId,
      command: 'enlist',
      args: [role.name],
      reply: reply,
    };
  },
  async messageHandler(interaction) {
    let reply = 'Error adding you to this role.';
    const role = interaction.mentions.roles.first();
    if (!role) return;
    try {
      await addUserRole(interaction.member!.user.id, interaction.guildId!!, role.id);
      reply = `Successfully added you to ${role.name}`;
    } catch (error) {
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
    let reply = 'Error adding you to this role.';
    const role = interaction.options.get('role')!.role;
    if (!role) return;
    try {
      await addUserRole(interaction.member!.user.id, interaction.guildId!, role.id);
      reply = `Successfully added you to ${role.name}`;
    } catch (error) {
      console.log(error);
    }

    await replyInteraction(interaction, reply);

    return {
      user: interaction.member!.user.id,
      guild: interaction.guildId!,
      channel: interaction.channelId,
      command: 'enlist',
      args: [...interaction.options.data],
      reply: reply,
    };
  },
  usage: '/enlist <role>',
  aliases: [],
};
