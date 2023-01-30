import { SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '@/utils/types';
import { replyInteraction } from '@/tasks/commands';

export const command: DiscordCommand = {
  data: new SlashCommandBuilder().setName('hello').setDescription('Friendly greeting'),
  async execute(interaction) {
    const reply = 'Hello!';
    const resp = await replyInteraction(interaction, reply);

    // Return data to be logged
    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: (this.data.name as string) ?? '',
      args: [],
      reply: reply,
    };
  },
  usage: '/hello',
  aliases: ['hi', 'hey'],
};
