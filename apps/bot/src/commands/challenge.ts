import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { TBot } from '@/utils/types';
import { replyInteraction } from '@/tasks/commands';
import botProvider from '..';

export const command: TBot.Command = {
  data: new SlashCommandBuilder()
    .setName('create-challenge')
    .setDescription('Create a challenge')
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
      command: 'create-challenge',
      args: [],
      reply: reply,
    };
  },
  usage: '/create-challenge <goal> <duration> <period> <start>',
  aliases: [],
};

export const challangeJoin: TBot.Command = {
  data: new SlashCommandBuilder()
    .setName('join-challenge')
    .setDescription('Join a challenge')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel of the challenge')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText),
    ),
  async messageHandler(interaction) {
    const reply = 'TODO';
    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'join-challenge',
      args: [],
      reply: reply,
    };
  },
  async execute(interaction) {
    let reply = 'You have joined a challenge!';

    const channelId = interaction.options.get('channel').value as string;
    const guildId = interaction.guildId;
    const userId = interaction.member.user.id;

    const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;
    try {
      const record = await habitTrackerController.joinChallenge(channelId, userId);
      await replyInteraction(interaction, reply);
    } catch (error) {
      reply = error?.message ?? 'Error executing that command';
      await replyInteraction(interaction, reply);
    }

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'join-challenge',
      args: [],
      reply: reply,
    };
  },
  usage: '/join-challenge <channelId>',
  aliases: [],
};

// Submit a challenge entry
// The command must be sent in the main channel of the challenge
export const challengeSubmit: TBot.Command = {
  data: new SlashCommandBuilder()
    .setName('submit-challenge')
    .setDescription('Submit a challenge entry')
    .addStringOption((option) =>
      option.setName('entry').setDescription('Entry value').setRequired(true),
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
    let reply = 'Submission received!';

    const channelId = interaction.channelId;
    const userId = interaction.member.user.id;

    const entry = interaction.options.get('entry').value as string;

    const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;

    try {
      const record = await habitTrackerController.submitEntry(channelId, userId, entry);
      await replyInteraction(interaction, reply);
    } catch (error) {
      reply = error?.message ?? 'Error executing that command';
      await replyInteraction(interaction, reply);
    }

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'submit-challenge',
      args: [],
      reply: reply,
    };
  },
  usage: '/submit-challenge <submission>',
  aliases: [],
};
