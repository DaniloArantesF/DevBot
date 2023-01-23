// Enlists a user into a guild role
import { SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '@utils/types';
import botProvider from '../index';

export const command: DiscordCommand = {
  data: new SlashCommandBuilder().setName('enlist').setDescription('Enlists a user into a role on this guild').addRoleOption((option) => option.setName('role').setDescription('The role to enlist the user into').setRequired(true)),
  async execute(interaction) {
    let reply = 'Error adding you to this role.';
    const roleOption = interaction.options.get('role');

    try {
      const discordClient = (await botProvider).getDiscordClient();
      await discordClient.addUserRole(interaction.user.id, interaction.guildId, roleOption.role.id)
      reply = `Successfully added you to ${roleOption.role.name}`;
    } catch (error) {
      console.log(interaction);
      console.log(error);
    }

    if (interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }

    return {
      user: interaction.user.id,
      command: interaction.commandName,
      args: interaction.options.data,
      result: reply,
    };
  },
  usage: '/enlist <role>',
  aliases: [],
};
