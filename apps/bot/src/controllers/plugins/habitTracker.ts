import { BotProvider } from '@/utils/types';
import { ChallengeData, GuildData } from 'shared/src/pocketbase';
import PocketBase from 'pocketbase';
import { getGuild } from '@/tasks/guild';
import { createChannel, getGuildChannel } from '@/tasks/channels';
import { ChannelType, CategoryChannel } from 'discord.js';
import ChallengeModel from '@/models/challenge';

interface HabitTracker {
  pocketbase: PocketBase;
  provider: BotProvider;
  challengeModel: ChallengeModel;
  ongoingChallenges: ChallengeData[];
  enabledGuilds: string[];
}

class HabitTracker {
  constructor(provider: BotProvider) {
    this.provider = provider;
    this.pocketbase = provider.getDataProvider().pocketbase;
    this.challengeModel = provider.getDataProvider().challenge;
    this.enabledGuilds = [];
  }

  // Reads in challenges from database
  // Schedules routine checks
  // Executes overdue tasks
  async setup() {
    await this.provider.getDataProvider().pocketbase.isAdmin;
    this.ongoingChallenges = await this.getOnGoingChallenges();

    const servers = (await this.pocketbase.collection('servers').getFullList()) as GuildData[];
    servers.forEach((server) => {
      if (server.plugins?.includes('habitTracker')) {
        this.enabledGuilds.push(server.guildId);
      }
    });

    for (const guildId of this.enabledGuilds) {
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

      // Create channels for ongoing challenges
      for (const challenge of this.ongoingChallenges) {
        let channel = await getGuildChannel(guildId, challenge.channelId);
        if (channel) continue;

        console.debug(`[${guildId}] Creating channel for challenge ${challenge.id}...`);

        channel = await createChannel(guildId, {
          name: `${challenge.duration}day-${challenge.goal}`,
          type: ChannelType.GuildText,
          parent: category as CategoryChannel,
        });

        this.pocketbase.collection('challenges').update(challenge.id, {
          channelId: channel.id,
        });
      }
    }
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
      .update(serverRecord.id, { plugins: [...currentPlugins, 'habitTracker'] });
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
      .update(serverRecord.id, { plugins: [...currentPlugins] });
  }

  async getOnGoingChallenges() {
    return (
      await this.pocketbase
        .collection('challenges')
        .getList<ChallengeData>(1, 100, { filter: 'status="inProgress"', $autoCancel: false })
    ).items;
  }

  async createChallenge(
    data: Omit<ChallengeData, 'id' | 'status' | 'channelId' | 'created' | 'updated'>,
  ) {
    const channel = await createChannel(data.guildId, {
      name: `${data.duration}day-${data.goal}`,
      type: ChannelType.GuildText,
      parent: (await getGuildChannel(data.guildId, '1071177234167107584')) as CategoryChannel,
    });

    const challengeData = {
      ...data,
      status: 'inProgress',
      channelId: channel.id,
    };

    const record = await this.challengeModel.create(challengeData);
    return record;
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

  // TODO
  async checkRoutine() {}
  async leaveChallenge(channelId: string, userId: string) {}

  async submitEntry(channelId: string, userId: string, entry: string) {
    const challenge = await this.challengeModel.getFromChannel(channelId);

    if (!challenge) {
      throw new Error('Invalid channel!');
    }

    const submissionType = 'text';
    return await this.challengeModel.createSubmission(challenge.id, userId, submissionType, entry);
  }
}

export default HabitTracker;
