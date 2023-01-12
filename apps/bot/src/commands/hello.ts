import { SlashCommandBuilder } from 'discord.js';
import { Command } from '.';

export const command: Command = {
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
