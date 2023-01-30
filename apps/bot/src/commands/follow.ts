import { SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { DiscordCommand } from '@/utils/types';
import { replyInteraction } from '@/tasks/commands';

export const contextCommand = new ContextMenuCommandBuilder()
  .setName('follow')
  .setType(ApplicationCommandType.User);

export const command: DiscordCommand = {
  data: new SlashCommandBuilder().setName('follow').setDescription('Follows a user'),
  async execute(interaction) {
    const reply = 'TODO';
    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: (this.data.name as string) ?? '',
      args: [],
      reply: reply,
    };
  },
  usage: '/follow <username>',
  aliases: [],
};
