import {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  User,
  Message,
  GuildMember,
} from 'discord.js';
import { TBot } from '@/utils/types';
import { replyInteraction } from '@/tasks/commands';
import botProvider from '..';
import { getDiscordAvatar } from 'shared/utils';
import { getUserMention } from '@/tasks/message';
import { getGuildMember } from '@/tasks/members';
import { TPocketbase } from '@/utils/types';

const DEBUG_CHALLENGE_PERIOD = 5 * 60 * 1000; // 5 minutes

// TODO: add option for sponsor notification frequency
async function promptSponsor(challenge: TPocketbase.Challenge, user: User, sponsor: GuildMember) {
  const filter = (m: Message) =>
    m.author.id === sponsor.user.id &&
    (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no');

  const dm = await sponsor.send({
    content: `You have been selected as a sponsor for ${getUserMention(
      user.id,
    )}'s challenge. Do you accept? (yes/no)`,
  });
  const collector = dm.channel.createMessageCollector({ filter, time: 15000 });

  collector.on('collect', async (m: Message) => {
    if (m.content.toLowerCase() === 'yes') {
      await dm.channel.send(
        `You are hereby granted the inexorable right to judge ${getUserMention(
          user.id,
        )} into oblivion if he fails to complete his challenge.`,
      );
    } else {
      await dm.channel.send(':(');
    }
    collector.stop();
  });

  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      await dm.channel.send(':/');
    } else {
      const challengeModel = (await botProvider).getDataProvider().challenge;
      const participant = (await challengeModel.getParticipants()).find(
        (p) => p.userId === user.id && p.challenge === challenge.id,
      );
      if (!participant) {
        console.error('Participant not found', user.id, challenge.id);
        return;
      }
      await challengeModel.updateParticipant({
        id: participant.id,
        sponsorId: sponsor.user.id,
        sponsorVerified: true,
      });

      const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;

      // Update participant cache
      await habitTrackerController.updateChallengeParticipants(challenge);
    }
  });
}

export async function notifySponsor(userId: string, sponsor: GuildMember) {
  const dm = await sponsor.send({
    content: `${getUserMention(userId)} has failed us all. Let them know how disappointed you are.`,
  });
}

export const command: TBot.Command = {
  data: new SlashCommandBuilder()
    .setName('create-challenge')
    .setDescription('Create a challenge')
    .addStringOption((option) =>
      option.setName('goal').setDescription('Short title for your challenge').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('duration').setDescription('The duration of the challenge').setRequired(true),
    )
    .addNumberOption((option) =>
      option.setName('period').setDescription('Period duration in days'),
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

    const periodDays = interaction.options.get('period')?.value as number;
    const period = periodDays ? periodDays * 24 * 60 * 60 * 1000 : DEBUG_CHALLENGE_PERIOD;

    const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;
    const record = await habitTrackerController.createChallenge({
      goal,
      duration,
      period,
      startDate: new Date().toISOString(),
      user: interaction.member.user.id,
      guildId: interaction.guildId,
      participants: [interaction.member.user.id],
      currentPeriod: 0,
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
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText),
    )
    .addUserOption((option) =>
      option.setName('sponsor').setDescription('Your sponsor for the challenge').setRequired(false),
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
    const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;
    let reply = 'You have joined a challenge!';

    let channelId = interaction.channelId;
    if (interaction.options.get('channel')) {
      channelId = interaction.options.get('channel').value as string;
    }

    const userId = interaction.member.user.id;
    const sponsor = interaction.options.getUser('sponsor');

    try {
      const record = await habitTrackerController.joinChallenge(channelId, {
        userId,
        sponsor: sponsor.id,
      });

      // Send message to verify sponsor
      const member = await getGuildMember(interaction.guildId, sponsor.id);
      if (member) {
        promptSponsor(record, interaction.user, member);
      }

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
  usage: '/join-challenge <channelId> <?sponsor>',
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
      command: 'submit-challenge',
      args: [],
      reply: reply,
    };
  },
  async execute(interaction) {
    let channelId = interaction.channelId;
    const userId = interaction.member.user.id;
    const entry = interaction.options.get('entry').value as string;
    let reply = {
      embeds: [
        new EmbedBuilder()
          .setTitle('Challenge Entry Submitted')
          .setColor(0x0000ff)
          .setAuthor({
            name: interaction.member.user.username,
            iconURL: getDiscordAvatar(
              'user',
              interaction.member.user.id,
              interaction.member.user.avatar ||
                (interaction.member.user as User).displayAvatarURL(),
            ),
          })
          .addFields({ name: 'Entry', value: entry }),
      ],
    };

    const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;

    if (interaction.channel.isThread()) {
      channelId = interaction.channel.parentId;
    }

    try {
      const { challenge } = await habitTrackerController.submitEntry(channelId, userId, entry);
      const activeThread = habitTrackerController.activeThreads.get(challenge);

      await activeThread.send(reply);
      await replyInteraction(interaction, { content: 'Submission received!', ephemeral: true });

      setTimeout(async () => {
        await interaction.deleteReply();
      }, 2 * 1000);
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
      reply: 'Success',
    };
  },
  usage: '/submit-challenge <submission>',
  aliases: [],
};

// Updates a challenge
export const challengeUpdate: TBot.Command = {
  data: new SlashCommandBuilder()
    .setName('update-challenge')
    .setDescription('Update a challenge')
    .addChannelOption((option) =>
      option.setName('challenge').setDescription('Challenge channel').setRequired(false),
    )
    .addStringOption((option) =>
      option.setName('goal').setDescription('Short title for your challenge').setRequired(false),
    )
    .addIntegerOption((option) =>
      option.setName('duration').setDescription('The duration of the challenge').setRequired(false),
    )
    .addIntegerOption((option) =>
      option.setName('period').setDescription('Period duration in days'),
    ),
  async messageHandler(interaction) {
    const reply = 'TODO';
    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'submit-challenge',
      args: [],
      reply: reply,
    };
  },
  async execute(interaction) {
    let channelId = interaction.options.get('challenge')?.value as string;
    if (!channelId) channelId = interaction.channelId;
    let reply = 'Successfully updated the challenge.';

    const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;

    let goal = interaction.options.get('goal')?.value as string;
    let duration = interaction.options.get('duration')?.value as number;
    let period = interaction.options.get('period')?.value as number;

    try {
      const data = {
        ...(goal && { goal }),
        ...(duration && { duration }),
        ...(period && { period }),
      };

      if (!Object.keys(data).length) {
        reply = 'You must provide at least one field to update';
        await replyInteraction(interaction, reply);
        return;
      }

      const challengeRecord = await habitTrackerController.challengeModel.getFromChannel(channelId);
      if (!challengeRecord) {
        reply = 'Invalid challenge!';
      } else {
        await habitTrackerController.challengeModel.update({ id: challengeRecord.id, ...data });
      }
    } catch (error) {
      reply = error?.message ?? 'Error executing that command';
    }

    await replyInteraction(interaction, reply);
    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'update-challenge',
      args: [],
      reply: 'Success',
    };
  },
  usage: '/update-challenge <?goal> <?duration> <?period>',
  aliases: [],
};

// Updates a challenge
export const challengeLeave: TBot.Command = {
  data: new SlashCommandBuilder()
    .setName('leave-challenge')
    .setDescription('Leave a challenge')
    .addChannelOption((option) =>
      option.setName('challenge').setDescription('Challenge channel').setRequired(false),
    ),
  async messageHandler(interaction) {
    const reply = 'TODO';
    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'submit-challenge',
      args: [],
      reply: reply,
    };
  },
  async execute(interaction) {
    let channelId = interaction.options.get('challenge')?.value as string;
    if (!channelId) channelId = interaction.channelId;
    let reply = 'Successfully removed you from the challenge :(';
    const habitTrackerController = (await botProvider).getTaskManager().habitTrackerController;

    // Remove participant from challenge. If no participants left, delete challenge
    try {
      const challengeRecord = await habitTrackerController.challengeModel.getFromChannel(channelId);
      if (!challengeRecord) {
        reply = 'Invalid challenge!';
      } else if (!challengeRecord.participants.includes(interaction.member.user.id)) {
        reply = 'You are not a participant of this challenge!';
      } else {
        const newParticipants = [
          ...challengeRecord.participants.filter((p) => p !== interaction.member.user.id),
        ];

        if (!newParticipants.length) {
          await habitTrackerController.challengeModel.delete(challengeRecord);
        } else {
          await habitTrackerController.challengeModel.update({
            id: challengeRecord.id,
            participants: [],
          });
        }
      }
    } catch (error) {
      reply = error?.message ?? 'Error executing that command';
    }

    await replyInteraction(interaction, reply);
    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'leave-challenge',
      args: [],
      reply: 'Success',
    };
  },
  usage: '/leave-challenge <?challenge>',
  aliases: [],
};
