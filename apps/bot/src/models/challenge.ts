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

    // TODO: send button to setup challenge
    return record;
  }

  async update(challenge: ChallengeUpdateOptions) {
    return await this.pocketbase
      .collection('challenges')
      .update<TPocketbase.Challenge>(challenge.id, challenge);
  }

  async getFromChannel(channelId: string) {
    return this.challenges.find((c) => c.channelId === channelId);
  }

  async createSubmission(data: TPocketbase.ChallengeSubmissionData) {
    const record = await this.pocketbase
      .collection('challenge_entry')
      .create<TPocketbase.ChallengeSubmission>(data);
    return record;
  }
}

export default ChallengeModel;
