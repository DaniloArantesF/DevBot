import type { BotProvider } from '@/utils/types';
import PocketBase from 'pocketbase';
import { getGuild } from '@/tasks/guild';
import { createChannel, getGuildChannel } from '@/tasks/channels';
import {
  EmbedBuilder,
  ChannelType,
  MessageCreateOptions,
  CategoryChannel,
  TextChannel,
  ThreadChannel,
  PermissionsBitField,
} from 'discord.js';
import ChallengeModel from '@/models/challenge';
import Queue from 'bee-queue';
import { queueSettings } from '@/TaskManager';
import { createRole, getGuildRole } from '@/tasks/roles';
import { createThread } from '@/tasks/thread';
import { getRoleMention, getUserMention } from '@/tasks/message';
import { notifySponsor } from '@/commands/challenge';
import { getGuildMember } from '@/tasks/members';
import { TPocketbase } from 'shared';
import { logger } from 'shared/logger';

interface HabitTracker {
  activeThreads: Map<string, ThreadChannel>; // challengeId -> threadId
  categoryChannelMap: Map<string, CategoryChannel>;
  challengeModel: ChallengeModel;
  enabledGuilds: string[];
  ongoingChallenges: TPocketbase.Challenge[];
  pocketbase: PocketBase;
  provider: BotProvider;
  queue: Queue<RoutineTaskData>;
  participants: Map<string, TPocketbase.ChallengeParticipant[]>; // challengeId -> participants

  // Jobs map
  // On init scheduled jobs are read in from redis
  scheduledTasks: Map<string, Queue.Job<RoutineTaskData>[]>; // challengeId -> job
}

interface RoutineTaskData {
  challengeId: string;
  date: string; // ISO string of scheduled data
  reminder: boolean;
}

class HabitTracker {
  constructor(provider: BotProvider) {
    this.provider = provider;
    this.pocketbase = provider.getDataProvider().pocketbase;
    this.challengeModel = provider.getDataProvider().challenge;
    this.enabledGuilds = [];
    this.categoryChannelMap = new Map();
    this.queue = new Queue<RoutineTaskData>('habit-queue', queueSettings);
    this.scheduledTasks = new Map();
    this.activeThreads = new Map();
    this.participants = new Map();
  }

  // Reads in challenges from database
  // Schedules routine checks
  // Executes overdue tasks
  async setup() {
    if (!await this.provider.getDataProvider().pocketbase.isAdmin) {
      logger.Warning('HabitTracker', 'Aborting setup. Pocketbase is not admin.');
    };
    this.ongoingChallenges = await this.getOnGoingChallenges();

    // Save participants
    const participants = await this.challengeModel.getParticipants();
    participants.forEach((participant) => {
      if (this.participants.has(participant.challenge)) {
        this.participants.get(participant.challenge)?.push(participant);
      } else {
        this.participants.set(participant.challenge, [participant]);
      }
    });

    // Get guilds with plugin enabled
    const servers = await this.pocketbase
      .collection('servers')
      .getFullList<TPocketbase.GuildData>();
    servers.forEach((server) => {
      if (server.plugins?.includes('habitTracker')) {
        this.enabledGuilds.push(server.guildId);
      }
    });

    // Initialize scheduled task map
    const scheduledJobs = await this.queue.getJobs('delayed', { start: 0, end: 1000 });

    for (const job of scheduledJobs) {
      const { challengeId } = job.data;
      if (this.scheduledTasks.has(challengeId)) {
        this.scheduledTasks.get(challengeId)?.push(job);
      } else {
        this.scheduledTasks.set(challengeId, [job]);
      }
    }

    for (const guildId of this.enabledGuilds) {
      const challengesCaterory = await this.getChallengesCategory(guildId);
      if (!challengesCaterory) continue; //TODO

      // Initialize category map
      this.categoryChannelMap.set(guildId,challengesCaterory);

      // Create channels for ongoing challenges
      for (const challenge of this.ongoingChallenges) {
        const updatedData: Partial<TPocketbase.ChallengeData> = {};
        let channel = (await getGuildChannel(guildId, challenge.channelId)) as TextChannel | null;

        if (!channel) {
          logger.Debug('Habit Tracker', `[${guildId}] Creating channel for challenge ${challenge.id}...`);
          channel = await createChannel(guildId, {
            name: `${challenge.duration}day-${challenge.goal}`,
            type: ChannelType.GuildText,
            parent: this.categoryChannelMap.get(guildId),
          });
          updatedData.channelId = channel!.id;
        }

        // Setup channel filter
        this.channelFilter(channel!);

        const day = challenge.currentPeriod;
        const threads = await this.getChallengeThreads(channel!.id);
        let thread = threads?.find((thread) => thread.name.includes(`Day ${day}`));

        if (!thread) {
          console.debug(`[${guildId}] Creating thread for challenge ${challenge.id}...`);
          thread = await createThread(challenge.guildId, channel!.id, {
            name: `Day ${day}`,
            autoArchiveDuration: 1440, // TODO: use period
          });
          await thread.send(`Give it up for day ${day}!`);
        }
        this.activeThreads.set(challenge.id, thread);

        let role = await getGuildRole(guildId, challenge.roleId);
        if (!role) {
          console.debug(`[${guildId}] Creating role for challenge ${challenge.id}...`);
          role = await createRole(guildId, {
            name: `${challenge.duration}day-${challenge.goal}`,
            mentionable: true,
          });
          updatedData.roleId = role!.id;
        }

        if (Object.keys(updatedData).length > 0) {
          await this.challengeModel.update({ id: challenge.id, ...updatedData });
        }

        // Schedule routine check
        this.scheduleCheck(challenge);
      }
    }

    // Process routine queue
    this.processRoutineChecks();
  }

  // Searches for challenge category in the guild
  // Creates one if it doesn't exist
  async getChallengesCategory(guildId: string) {
    if (this.categoryChannelMap.has(guildId)) {
      return this.categoryChannelMap.get(guildId);
    }

    const guild = await getGuild(guildId);
    if (!guild) return null;

    // Check category exists
    let category = guild.channels.cache.find((channel) => channel.name === 'Challenges') as CategoryChannel | null;

    if (!category) {
      console.debug(`[${guildId}] Creating challenges category...`);
      category = await createChannel<CategoryChannel>(guildId, {
        name: 'Challenges',
        type: ChannelType.GuildCategory,
      });
    }
    return category as CategoryChannel;
  }

  // Enables habit tracking for a guild
  async enable(guildId: string) {
    const guildRepository = this.provider.getDataProvider().guild;
    const serverRecord = await guildRepository.get(guildId);
    const currentPlugins: string[] = serverRecord.plugins || [];
    if (currentPlugins.includes('habitTracker')) {
      return serverRecord;
    }
    return await this.pocketbase
      .collection('servers')
      .update<TPocketbase.Guild>(serverRecord.id, { plugins: [...currentPlugins, 'habitTracker'] });
  }

  // Disables habit tracking for a guild
  async disable(guildId: string) {
    const guildRepository = this.provider.getDataProvider().guild;
    const serverRecord = await guildRepository.get(guildId);
    const currentPlugins = serverRecord.plugins as string[];
    if (!currentPlugins || !currentPlugins.includes('habitTracker')) return serverRecord;

    currentPlugins.splice(currentPlugins.indexOf('habitTracker'), 1);

    return await this.pocketbase
      .collection('servers')
      .update<TPocketbase.Guild>(serverRecord.id, { plugins: [...currentPlugins] });
  }

  async getOnGoingChallenges() {
    logger.Debug('HabitTracker', 'Fetching ongoing challenges.');
    try {
      return (
        await this.pocketbase.collection('challenges').getList<TPocketbase.Challenge>(1, 100, {
          filter: 'status="inProgress"',
          $autoCancel: false,
        })
      ).items;
    } catch (error) {
      return [];
    }
  }

  async createChallenge(data: TPocketbase.ChallengeCreateOptions) {
    // Create challenge channel
    const parent = await this.getChallengesCategory(data.guildId);
    const channel = (await createChannel(data.guildId, {
      name: `${data.duration}day-${data.goal}`,
      type: ChannelType.GuildText,
      parent,
    })) as TextChannel;

    // Create challenge role
    const role = await createRole(data.guildId, {
      name: `${data.duration}day-${data.goal}`,
      mentionable: true,
      color: 0x00ffff,
    });

    const challengeData = {
      ...data,
      status: 'inProgress',
      channelId: channel.id,
      roleId: role!.id,
    };

    // Create day 0 thread
    const thread = await createThread(data.guildId, channel.id, {
      name: 'Day 0',
      autoArchiveDuration: 1440, // 24 hours
    });
    await thread.send(`Give it up for day 0!`);

    // Save to database
    const challenge = await this.challengeModel.create(challengeData as TPocketbase.ChallengeData);

    const participants = data.participants.map(
      async (participant) =>
        await this.challengeModel.createParticipant({
          challenge: challenge.id,
          userId: participant,
          streak: 0,
        }),
    );

    // Save to cache
    this.ongoingChallenges.push(challenge);
    this.activeThreads.set(challenge.id, thread);
    this.participants.set(challenge.id, await Promise.all(participants));

    // Schedule routine check
    this.scheduleCheck(challenge);

    return challenge;
  }

  /**
   * Joins a user to a challenge
   * Updates the challenge in the database and cache
   * @throws Error if user already joined the challenge
   * @throws Error if channel is not a challenge channel
   */
  async joinChallenge(
    channelId: string,
    { userId, ...options }: { userId: string; sponsor?: string },
  ) {
    const challenge = await this.challengeModel.getFromChannel(channelId);
    if (!challenge) {
      throw new Error('Invalid channel!');
    }

    if (challenge.participants.includes(userId)) {
      throw new Error('You already joined this challenge!');
    }

    const updatedChallenge = await this.challengeModel.update({
      id: challenge.id,
      participants: [...challenge.participants, userId],
    });

    await this.challengeModel.createParticipant({
      challenge: challenge.id,
      userId: userId,
      streak: 1,
      lastUpdate: new Date().toISOString(),
      sponsorId: options.sponsor ?? '',
    });

    // Update cached entities
    const i = this.ongoingChallenges.findIndex((c) => c.id === challenge.id);
    this.ongoingChallenges[i] = updatedChallenge;
    await this.updateChallengeParticipants(updatedChallenge);

    return updatedChallenge;
  }

  async scheduleCheck(challenge: TPocketbase.Challenge) {
    // Check is already scheduled
    if (this.scheduledTasks.has(challenge.id)) {
      return;
    }

    let periodEndOffset = 2000;
    const now = new Date();
    let lastCheck = new Date(),
      nextCheck = new Date();

    if (challenge.lastCheck) {
      lastCheck = new Date(challenge.lastCheck);
    }

    nextCheck.setTime(lastCheck.getTime() + challenge.period - periodEndOffset);

    const job = this.queue.createJob<RoutineTaskData>({
      challengeId: challenge.id,
      date: nextCheck.toISOString(),
      reminder: false,
    });

    if (nextCheck.getTime() - now.getTime() > 10000) {
      console.debug(
        `[${challenge.guildId}] Check for \"${
          challenge.goal
        }\" scheduled for ${nextCheck.toISOString()} `,
      );
      job.delayUntil(nextCheck);
    } else {
      console.debug(`[${challenge.guildId}] Check for \"${challenge.goal}\" is overdue!`);
    }

    // Schedule reminder
    // halfway through the difference between now and next check
    const reminderDate = new Date(nextCheck.getTime() - (nextCheck.getTime() - now.getTime()) / 2);
    const reminderJob = this.queue.createJob<RoutineTaskData>({
      challengeId: challenge.id,
      date: reminderDate.toISOString(),
      reminder: true,
    });

    if (reminderDate.getTime() - now.getTime() > 10000) {
      console.debug(
        `[${challenge.guildId}] Reminder for \"${
          challenge.goal
        }\" scheduled for ${reminderDate.toISOString()} `,
      );
      reminderJob.delayUntil(reminderDate);
    } else {
      console.debug(`[${challenge.guildId}] Reminder for \"${challenge.goal}\" is overdue!`);
    }

    await job.save(), await reminderJob.save();
    this.scheduledTasks.set(challenge.id, [job, reminderJob]);
  }

  async processRoutineChecks() {
    logger.Debug('Habit Tracker', 'Processing routine tasks.');

    this.queue.process(async (job) => {
      const { challengeId, reminder } = job.data;
      const challenge = this.ongoingChallenges.find((challenge) => challenge.id === challengeId);
      if (!challenge) {
        throw new Error(`Challenge ${challengeId} not found!`);
      }

      if (reminder) {
        await this.sendAlert(challenge);
      } else {
        await this.checkRoutine(challenge);
      }
    });
  }

  getCurrentDay(challenge: TPocketbase.Challenge) {
    const now = new Date();
    return Math.floor((now.getTime() - new Date(challenge.startDate).getTime()) / challenge.period);
  }

  // Challenge routine check
  // Responsible for scheduling the next check
  async checkRoutine(challenge: TPocketbase.Challenge) {
    if (!challenge || !challenge.guildId) {
      logger.Warning('Habit Tracker', `Invalid challenge: ${challenge}. Aborting check`);
    };

    logger.Debug('Habit Tracker', `Checking routine for challenge ${challenge.id}`);

    const role = await getGuildRole(challenge.guildId, challenge.roleId);

    if (!role) {
      throw new Error(`Error finding role ${challenge.roleId} for guild ${challenge.guildId}`);
    }

    // today's stats
    const participantStatus: {
      userId: string;
      submitted: boolean;
      streak: boolean;
      missed: number;
    }[] = [];
    const challengeDay = challenge.currentPeriod;

    console.debug(
      `[${challenge.guildId}] Checking challenge \"${challenge.goal}\" on day ${challengeDay}.`,
    );

    // Get today's submissions
    for (const participantUserId of challenge.participants) {
      const { submitted, streak, missed } = await this.getUserStats(challenge, participantUserId);

      let participantRecord = this.participants
        .get(challenge.id)
        ?.find((p) => p.userId === participantUserId);

      if (!participantRecord) continue;

      const updateData: Partial<TPocketbase.ChallengeParticipantData> = {};

      if (streak) {
        updateData.streak = participantRecord.streak + 1;
      }

      if (submitted) {
        updateData.lastUpdate = new Date().toISOString();
      }

      if (Object.keys(updateData).length > 0) {
        participantRecord = await this.challengeModel.updateParticipant({
          id: participantRecord.id,
          ...updateData,
        });
      }

      // Update cache
      const i = this.participants
        .get(challenge.id)
        ?.findIndex((p) => p.userId === participantUserId);

      if (i === undefined || !participantRecord) continue;

      this.participants.get(challenge.id)![i] = participantRecord;
      participantStatus.push({
        userId: participantUserId,
        submitted,
        streak,
        missed,
      });
    }

    const submissionCount = participantStatus.reduce((prevCount, { submitted }) => {
      return prevCount + Number(submitted);
    }, 0);

    const sinners = participantStatus.filter((status) => !status.submitted);
    const streakers = participantStatus.filter((status) => status.streak);

    const message: MessageCreateOptions = {
      content: `${getRoleMention(role.id)} hello friends`,
      embeds: [],
    };
    message.embeds!.push(
      new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`Day ${challengeDay} Stats`)
        .addFields([
          {
            name: 'Submissions',
            value: `${submissionCount}/${participantStatus.length}`,
            inline: false,
          },
          {
            name: 'Streakers',
            value: streakers.length
              ? streakers.map((s) => getUserMention(s.userId)).join(', ')
              : 'None :(',
          },
        ])
        .setFooter({
          text: `You can join the challenge by typing /join-challenge in this channel`,
        }),
    );

    if (sinners.length > 0) {
      message.embeds!.push(
        new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Wall of Shame')
          .setImage('https://media.tenor.com/AnYA89a43qcAAAAC/shame-walk.gif')
          .setDescription('These people were a disappointment to the community.')
          .addFields(
            sinners.map((sinner, index) => {
              return {
                name: `Sinner #${index + 1}`,
                value: `${getUserMention(sinner.userId)} Missed ${
                  sinner.missed + 1
                } days already. SHAME!`,
                inline: true,
              };
            }),
          ),
      );
    }

    const channel = await getGuildChannel(challenge.guildId, challenge.channelId) as TextChannel;
    if (!channel || !channel.isTextBased()) {
      logger.Warning(
        'Habit Tracker',
        `Invalid channel ${challenge.channelId} for guild ${challenge.guildId}. Aborting check`,
      );
      return;
    };
    await channel.send(message);

    // Update challenge and schedule next check
    challenge = await this.challengeModel.update({
      id: challenge.id,
      lastCheck: new Date().toISOString(),
      currentPeriod: challengeDay + 1,
    });

    // Create next thread
    let thread = await createThread(challenge.guildId, channel.id, {
      name: `Day ${challengeDay + 1}`,
      autoArchiveDuration: 1440, // 24 hours
    });
    await thread.send(`Give it up for day ${challengeDay + 1}!`);

    // Update cache
    this.activeThreads.set(challenge.id, thread);
    const i = this.ongoingChallenges.findIndex((c) => c.id === challenge.id);
    this.ongoingChallenges[i] = challenge;

    this.scheduledTasks.delete(challenge.id);
    await this.scheduleCheck(challenge);

    // notify sponsors ?await
    this.notifySponsors(
      challenge,
      sinners.map((sinner) => sinner.userId),
    );
  }

  async getUserStats(challenge: TPocketbase.Challenge, userId: string) {
    const day = challenge.currentPeriod;
    const submissions = await this.challengeModel.getUserSubmissions(challenge.id, userId);

    const submitted = submissions.some((submission) => submission.day === day);
    let isStreak = false;
    if (day > 0) {
      const submittedYesterday = submissions.some((submission) => submission.day === day - 1);
      isStreak = submitted && submittedYesterday;
    }

    let missCount = 0;
    for (let i = 0; i < day; i++) {
      // TODO: only count miss from date of joining
      const missed = !submissions.some((submission) => submission.day === i);
      missCount += Number(missed);
    }

    return {
      submitted: submitted,
      missed: missCount,
      streak: isStreak,
      submissions,
    };
  }

  async notifySponsors(challenge: TPocketbase.Challenge, users: string[]) {
    for (const user of users) {
      const sponsorId = this.participants
        .get(challenge.id)
        ?.find((p) => p.userId === user)?.sponsorId;
      if (!sponsorId) continue;
      const sponsor = await getGuildMember(challenge.guildId, sponsorId);
      if (!sponsor) continue;
      await notifySponsor(user, sponsor);
    }
  }

  async updateChallengeParticipants(challenge: TPocketbase.Challenge) {
    logger.Debug('Habit Tracker', `Updating participants for challenge ${challenge.id}`);
    const challengeParticipants = await this.challengeModel.getParticipants(challenge.id);
    this.participants.set(challenge.id, challengeParticipants);
  }

  async leaveChallenge(channelId: string, userId: string) {}

  async submitEntry(channelId: string, userId: string, entry: string) {
    const challenge = await this.challengeModel.getFromChannel(channelId);
    if (!challenge) {
      throw new Error('Invalid channel!');
    }

    // Calculate entry's day
    const day = challenge.currentPeriod;

    // Add user to challenge if they're not already in it
    if (challenge.participants.indexOf(userId) === -1) {
      await this.joinChallenge(channelId, { userId });
    }

    return await this.challengeModel.createSubmission({
      challenge: challenge.id,
      userId,
      type: 'text',
      value: entry,
      day,
    });
  }

  async sendAlert(challenge: TPocketbase.Challenge) {
    const thread = this.activeThreads.get(challenge.id);
    const task = this.scheduledTasks.get(challenge.id)?.find((j) => j.data.reminder === false);
    if (!thread || !task) {
      return;
    }

    const nextCheck = new Date(task.data.date);

    const diff = nextCheck.getTime() - new Date().getTime();

    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60 / 60 - hours) * 60);

    logger.Debug('Habit Tracker', `[${challenge.guildId}] Sending reminder for \"${challenge.goal}\" on day ${challenge.currentPeriod}.`);

    await thread.send(
      `${getRoleMention(challenge.roleId)} ${hours}:${minutes
        .toString()
        .padStart(2, '0')} left to submit your entries!`,
    );
  }

  async getChallengeThreads(channelId: string) {
    const challenge = this.ongoingChallenges.find((challenge) => challenge.channelId === channelId);
    if (!challenge) {
      return null;
    }
    const channel = (await getGuildChannel(challenge.guildId, challenge.channelId)) as TextChannel;
    const threads = channel.threads.cache;
    return threads;
  }

  // Removes any messages that are not from an admin, or a challenge command
  async channelFilter(channel: TextChannel) {
    channel.client.on('messageCreate', async (message) => {
      if (message.channelId !== channel.id || message.author.bot) {
        return;
      }

      const isValidCommand = Boolean(message?.interaction?.commandName?.includes('challenge'));
      const isAdmin = message.member!.permissions.has(PermissionsBitField.Flags.ManageChannels);

      if (!isValidCommand && !isAdmin) {
        const userId = message.author.id;
        await message.delete();

        const warn = await channel.send(
          `${getUserMention(
            userId,
          )} this channel is only for challenge commands.\nPlease use today's thread for discussion.`,
        );
        setTimeout(() => {
          warn.delete();
        }, 5000);
      }
    });
  }
}

export default HabitTracker;
