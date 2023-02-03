// TODO: challenge-submit
// TODO: challenge-join
import { SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '@/utils/types';
import { replyInteraction } from '@/tasks/commands';
import botProvider from '..';

export const command: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName('create-challenge')
    .setDescription('Creates a challenge')
    .addStringOption((option) =>
      option.setName('goal').setDescription('Short title for your challenge').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('duration').setDescription('The duration of the challenge').setRequired(true),
    ),
  async messageHandler(interaction) {
    const reply = 'TODO';
    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'create-challenge',
      args: [],
      reply: reply,
    };
  },
  async execute(interaction) {
    const reply = 'Successfully created a challenge!';
    const goal = interaction.options.get('goal').value as string;
    const duration = interaction.options.get('duration').value as number;
    const period = 1;

    const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;
    const record = habitTrackerController.createChallenge({
      goal,
      duration,
      period,
      startDate: new Date().toISOString(),
      user: interaction.member.user.id,
      guildId: interaction.guildId,
      participants: [interaction.member.user.id],
    });
    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'challenge-create',
      args: [],
      reply: reply,
    };
  },
  usage: '/challenge-create <goal> <duration> <period> <start>',
  aliases: [],
};
