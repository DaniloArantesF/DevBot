import { SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '@utils/types';

export const command: DiscordCommand = {
  data: new SlashCommandBuilder().setName('hello').setDescription('Friendly greeting'),
  async execute(interaction) {
    if (interaction.deferred) {
      await interaction.editReply('Hello!');
      return;
    }
    await interaction.reply('Hello!');
  },
  usage: '/hello',
  aliases: ['hi', 'hey'],
};
