import { SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { DiscordCommand } from '@utils/types';

export const contextCommand = new ContextMenuCommandBuilder()
  .setName('follow')
  .setType(ApplicationCommandType.User);

export const command: DiscordCommand = {
  data: new SlashCommandBuilder().setName('follow').setDescription('Follows a user'),
  async execute(interaction) {
    const reply = 'TODO';
    if (interaction.deferred) {
      await interaction.editReply(reply);
      return;
    }
    await interaction.reply(reply);
  },
  usage: '/follow <username>',
  aliases: [],
};
