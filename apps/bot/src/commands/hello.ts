import { SlashCommandBuilder } from 'discord.js';
import { Command } from '.';

export const command: Command = {
  data: new SlashCommandBuilder().setName('hello').setDescription('Friendly greeting'),
  async execute(interaction) {
    await interaction.reply('Hello!');
  },
  usage: '/hello',
  aliases: ['hi', 'hey'],
};
