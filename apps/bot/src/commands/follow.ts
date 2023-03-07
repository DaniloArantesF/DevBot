import { SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { TBot } from '@/utils/types';
import { replyInteraction } from '@/tasks/commands';

export const contextCommand = new ContextMenuCommandBuilder()
  .setName('follow')
  .setType(ApplicationCommandType.User);

export const command: TBot.Command = {
  data: new SlashCommandBuilder().setName('follow').setDescription('Follows a user'),
  async messageHandler(interaction) {
    const reply = 'TODO';
    await replyInteraction(interaction, reply);

    return {
      user: interaction.member!.user.id,
      guild: interaction.guildId!,
      channel: interaction.channelId,
      command: 'follow',
      args: [],
      reply: reply,
    };
  },
  async execute(interaction) {
    const reply = 'TODO';
    await replyInteraction(interaction, reply);

    return {
      user: interaction.member!.user.id,
      guild: interaction.guildId!,
      channel: interaction.channelId,
      command: 'follow',
      args: [],
      reply: reply,
    };
  },
  usage: '/follow <username>',
  aliases: [],
};
