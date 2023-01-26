import { SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '@/utils/types';

export const command: DiscordCommand = {
  data: new SlashCommandBuilder().setName('hello').setDescription('Friendly greeting'),
  async execute(interaction) {
    const reply = 'Hello!';

    if (interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }

    // Return data to be logged
    return {
      user: interaction.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: interaction.commandName,
      args: [...interaction.options.data],
      reply: reply,
    };
  },
  usage: '/hello',
  aliases: ['hi', 'hey'],
};
