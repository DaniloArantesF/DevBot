import type { BotProvider, TPocketbase } from '@/utils/types';
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
} from 'discord.js';
import ChallengeModel from '@/models/challenge';
import Queue from 'bee-queue';
import { queueSettings } from '@/TaskManager';
import { createRole, getGuildRole } from '@/tasks/roles';
import { createThread } from '@/tasks/thread';
import { getRoleMention, getUserMention } from '@/tasks/message';
import { getGuildMember } from '@/tasks/members';

interface HabitTracker {
  activeThreads: Map<string, ThreadChannel>; // challengeId -> threadId
  categoryChannelMap: Map<string, CategoryChannel>;
  challengeModel: ChallengeModel;
  enabledGuilds: string[];
  ongoingChallenges: TPocketbase.Challenge[];
  pocketbase: PocketBase;
  provider: BotProvider;
  routineQueue: Queue<RoutineTaskData>;

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
    this.routineQueue = new Queue<RoutineTaskData>('habit-queue', queueSettings);
    this.scheduledTasks = new Map();
    this.activeThreads = new Map();
  }

  // Reads in challenges from database
  // Schedules routine checks
  // Executes overdue tasks
  async setup() {
    await this.provider.getDataProvider().pocketbase.isAdmin;
    this.ongoingChallenges = await this.getOnGoingChallenges();

    const servers = await this.pocketbase
      .collection('servers')
      .getFullList<TPocketbase.GuildData>();
    servers.forEach((server) => {
      if (server.plugins?.includes('habitTracker')) {
        this.enabledGuilds.push(server.guildId);
      }
    });

    // Initialize scheduled task map
    const scheduledJobs = await this.routineQueue.getJobs('delayed', { start: 0, end: 1000 });

    for (const job of scheduledJobs) {
      const { challengeId } = job.data;
      if (this.scheduledTasks.has(challengeId)) {
        this.scheduledTasks.get(challengeId).push(job);
      } else {
        this.scheduledTasks.set(challengeId, [job]);
      }
    }

    for (const guildId of this.enabledGuilds) {
      // Initialize category map
      this.categoryChannelMap.set(guildId, await this.getChallengesCategory(guildId));

      // Create channels for ongoing challenges
      for (const challenge of this.ongoingChallenges) {
        const updatedData: Partial<TPocketbase.ChallengeData> = {};
        let channel = await getGuildChannel(guildId, challenge.channelId);

        if (!channel) {
          console.debug(`[${guildId}] Creating channel for challenge ${challenge.id}...`);
          channel = await createChannel(guildId, {
            name: `${challenge.duration}day-${challenge.goal}`,
            type: ChannelType.GuildText,
            parent: this.categoryChannelMap.get(guildId),
          });
          updatedData.channelId = channel.id;
        }

        const day = this.getCurrentDay(challenge);
        const threads = await this.getChallengeThreads(channel.id);
        let thread = threads?.find((thread) => thread.name.includes(`Day ${day}`));

        if (!thread) {
          console.debug(`[${guildId}] Creating thread for challenge ${challenge.id}...`);
          thread = await createThread(challenge.guildId, channel.id, {
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
          updatedData.roleId = role.id;
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

    // Check category exists
    let category = guild.channels.cache.find((channel) => channel.name === 'Challenges');
    if (!category) {
      console.debug(`[${guildId}] Creating challenges category...`);
      category = await createChannel(guildId, {
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
    return (
      await this.pocketbase.collection('challenges').getList<TPocketbase.Challenge>(1, 100, {
        filter: 'status="inProgress"',
        $autoCancel: false,
      })
    ).items;
  }

  async createChallenge(data: TPocketbase.ChallengeCreateOptions) {
    // Create challenge channel
    const parentCategory = await this.getChallengesCategory(data.guildId);
    const channel = (await createChannel(data.guildId, {
      name: `${data.duration}day-${data.goal}`,
      type: ChannelType.GuildText,
      parent: (await getGuildChannel(data.guildId, parentCategory.id)) as CategoryChannel,
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
      roleId: role.id,
    };

    // Create day 0 thread
    const thread = await createThread(data.guildId, channel.id, {
      name: 'Day 0',
      autoArchiveDuration: 1440, // 24 hours
    });
    await thread.send(`Give it up for day 0!`);

    // Save to database
    const challenge = await this.challengeModel.create(challengeData as TPocketbase.ChallengeData);

    // Save to cache
    this.ongoingChallenges.push(challenge);
    this.activeThreads.set(challenge.id, thread);

    // Schedule routine check
    this.scheduleCheck(challenge);

    return challenge;
  }

  async joinChallenge(channelId: string, userId: string) {
    const challenge = await this.challengeModel.getFromChannel(channelId);
    if (!challenge) {
      throw new Error('Invalid channel!');
    }

    if (challenge.participants.includes(userId)) {
      throw new Error('You already joined this challenge!');
    }

    return await this.challengeModel.update({
      id: challenge.id,
      participants: [...challenge.participants, userId],
    });
  }

  async scheduleCheck(challenge: TPocketbase.Challenge) {
    // Check is already scheduled
    if (this.scheduledTasks.has(challenge.id)) {
      return;
    }

    let periodEndOffset = challenge.period * 0.1;
    const now = new Date();
    let lastCheck = new Date(),
      nextCheck = new Date();

    if (challenge.lastCheck) {
      lastCheck = new Date(challenge.lastCheck);

      // Offset should only be added once, otherwise it compounds?
      periodEndOffset = 0;
    }

    nextCheck.setTime(lastCheck.getTime() + challenge.period - periodEndOffset);

    const job = this.routineQueue.createJob({
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
    const reminderJob = this.routineQueue.createJob({
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
    await this.provider.getDataProvider().pocketbase.isAdmin;

    this.routineQueue.process(async (job) => {
      const { challengeId, reminder } = job.data;
      const challenge = this.ongoingChallenges.find((challenge) => challenge.id === challengeId);
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
    const role = await getGuildRole(challenge.guildId, challenge.roleId);

    // today's stats
    const participantStatus: { userId: string; submitted: boolean }[] = [];
    const challengeDay = this.getCurrentDay(challenge);

    console.debug(
      `[${challenge.guildId}] Checking challenge \"${challenge.goal}\" on day ${challengeDay}.`,
    );

    // Get today's submissions
    for (const participant of challenge.participants) {
      const todaySubmissions = await this.challengeModel.getSubmissionByDay(
        challenge.id,
        participant,
        challengeDay,
      );

      participantStatus.push({
        userId: participant,
        submitted: todaySubmissions.length > 0,
      });
    }

    const submissionCount = participantStatus.reduce((prevCount, { submitted }) => {
      return prevCount + Number(submitted);
    }, 0);

    const sinners = participantStatus.filter((status) => !status.submitted);

    const message: MessageCreateOptions = {
      content: `${getRoleMention(role.id)} hello friends`,
      embeds: [
        new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(`Day ${challengeDay} Stats`)
          .addFields([
            {
              name: 'Submissions',
              value: `${submissionCount}/${participantStatus.length}`,
              inline: false,
            },
          ])
          .setFooter({
            text: `You can join the challenge by typing /join-challenge in this channel`,
          }),
      ],
    };

    if (sinners.length > 0) {
      message.embeds.push(
        new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Wall of Shame')
          .setImage('https://media.tenor.com/AnYA89a43qcAAAAC/shame-walk.gif')
          .setDescription('These people were a disappointment to the community.')
          .addFields(
            sinners.map((sinner, index) => {
              return {
                name: `Sinner #${index + 1}`,
                value: `${getUserMention(sinner.userId)} Missed ${Math.floor(
                  Math.random() * 10,
                )}. SHAME!`,
                inline: true,
              };
            }),
          ),
      );
    }

    const channel = await getGuildChannel(challenge.guildId, challenge.channelId);
    if (!channel || !channel.isTextBased()) return;
    await channel.send(message);

    // Update challenge and schedule next check
    challenge = await this.challengeModel.update({
      id: challenge.id,
      lastCheck: new Date().toISOString(),
    });

    // Create next thread
    let thread = await createThread(challenge.guildId, channel.id, {
      name: `Day ${challengeDay + 1}`,
      autoArchiveDuration: 1440, // 24 hours
    });
    await thread.send(`Give it up for day ${challengeDay + 1}!`);

    // Update cache
    this.activeThreads.set(challenge.id, thread);

    this.scheduledTasks.delete(challenge.id);
    await this.scheduleCheck(challenge);
  }

  async leaveChallenge(channelId: string, userId: string) {}

  async submitEntry(channelId: string, userId: string, entry: string) {
    const challenge = await this.challengeModel.getFromChannel(channelId);

    if (!challenge) {
      throw new Error('Invalid channel!');
    }

    // Calculate entry's day
    const day = this.getCurrentDay(challenge);
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
    if (!thread) {
      return;
    }

    const { data } = this.scheduledTasks.get(challenge.id)?.find((j) => j.data.reminder === false);
    const nextCheck = new Date(data.date);

    const diff = nextCheck.getTime() - new Date().getTime();

    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60 / 60 - hours) * 60);

    console.debug(
      `[${challenge.guildId}] Sending reminder for \"${
        challenge.goal
      }\" on day ${this.getCurrentDay(challenge)}.`,
    );

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
}

export default HabitTracker;
