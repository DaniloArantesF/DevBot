import { PocketBase } from '@/DataProvider';
import { TPocketbase } from 'shared/src/pocketbase';

interface ChallengeModel {
  pocketbase: PocketBase;
  challenges: TPocketbase.Challenge[];
}

type ChallengeUpdateOptions = { id: string } & Partial<TPocketbase.ChallengeData>;

class ChallengeModel {
  constructor(pocketbase: PocketBase) {
    this.pocketbase = pocketbase;
    this.init();
  }

  async init() {
    await this.pocketbase.isAdmin;
    this.challenges = await this.pocketbase
      .collection('challenges')
      .getFullList(1, { $autoCancel: false });
  }

  async get(challengeId: string) {
    const challenge = await this.pocketbase
      .collection('challenges')
      .getOne<TPocketbase.Challenge>(challengeId);
    return challenge;
  }

  async getAll() {
    const challenges = await this.pocketbase
      .collection('challenges')
      .getList<TPocketbase.Challenge>(1, 100, { filter: 'inProgress=true' });
    return challenges;
  }

  async create(challenge: TPocketbase.ChallengeData) {
    const record = await this.pocketbase
      .collection('challenges')
      .create<TPocketbase.Challenge>(challenge);

    this.challenges.push(record);
    // TODO: send button to setup challenge
    return record;
  }

  async update(challenge: ChallengeUpdateOptions) {
    return await this.pocketbase
      .collection('challenges')
      .update<TPocketbase.Challenge>(challenge.id, challenge);
  }

  async getFromChannel(channelId: string) {
    return await this.pocketbase
      .collection('challenges')
      .getFirstListItem<TPocketbase.Challenge>(`channelId = "${channelId}"`);
  }

  async createSubmission(data: TPocketbase.ChallengeSubmissionData) {
    try {
      const record = await this.pocketbase
        .collection('challenge_entry')
        .create<TPocketbase.ChallengeSubmission>(data);
      return record;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create submission');
    }
  }

  async getUserLatestSubmission(challengeId: string, userId: string) {
    try {
      const submissions = await this.pocketbase
        .collection('challenge_entry')
        .getList<TPocketbase.ChallengeSubmission>(1, 1, {
          filter: `challenge = "${challengeId}"`,
          sort: '-created',
          $autoCancel: false,
        });
      if (!submissions.items.length) {
        return null;
      }

      return submissions.items[0];
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getSubmissionByDay(challengeId: string, userId: string, day: number) {
    try {
      if (day < 0) return [];
      const submissions = await this.pocketbase
        .collection('challenge_entry')
        .getList<TPocketbase.ChallengeSubmission>(1, 10, {
          filter: `challenge = "${challengeId}" && userId = "${userId}" && day = ${day}`,
          $autoCancel: false,
        });
      if (!submissions.items.length) {
        return [];
      }
      return submissions.items;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getUserSubmissions(challengeId: string, userId: string) {
    try {
      const submissions = await this.pocketbase
        .collection('challenge_entry')
        .getFullList<TPocketbase.ChallengeSubmission>(1, {
          filter: `challenge = "${challengeId}" && userId = "${userId}"`,
          $autoCancel: false,
        });

      return submissions;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async createParticipant(data: TPocketbase.ChallengeParticipantData) {
    try {
      const record = await this.pocketbase
        .collection('challenge_participant')
        .create<TPocketbase.ChallengeParticipant>(data);
      return record;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create participant');
    }
  }

  async getParticipants(challengeId?: string) {
    try {
      const participants = await this.pocketbase
        .collection('challenge_participant')
        .getFullList<TPocketbase.ChallengeParticipant>(1, {
          ...(challengeId && { filter: `challenge = "${challengeId}"` }),
        });
      return participants;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async updateParticipant(data: Partial<TPocketbase.ChallengeParticipant> & { id: string }) {
    try {
      const record = await this.pocketbase
        .collection('challenge_participant')
        .update<TPocketbase.ChallengeParticipant>(data.id, data);
      return record;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to update participant');
    }
  }
}

export default ChallengeModel;
