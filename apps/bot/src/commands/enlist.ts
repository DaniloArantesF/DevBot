// Enlists a user into a guild role
import { SlashCommandBuilder, Message } from 'discord.js';
import { DiscordCommand } from '@utils/types';
import { addUserRole } from '@/tasks/roles';
import { replyInteraction } from '@/tasks/commands';

export const command: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName('enlist')
    .setDescription('Enlists a user into a role on this guild')
    .addRoleOption((option) =>
      option.setName('role').setDescription('The role to enlist the user into').setRequired(true),
    ),
  async execute(interaction) {
    let reply = 'Error adding you to this role.';
    const isMessage = interaction instanceof Message;
    let role = null;

    if (isMessage) {
      role = interaction.mentions.roles.first();
    } else {
      role = interaction.options.get('role').role;
    }

    // TODO: check if user has role
    try {
      await addUserRole(interaction.member.user.id, interaction.guildId, role.id);
      reply = `Successfully added you to ${role.name}`;
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
  usage: '/enlist <role>',
  aliases: [],
};
