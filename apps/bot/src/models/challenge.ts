import { PocketBase } from '@/DataProvider';
import { ChallengeData, PbBase } from 'shared/src/pocketbase';

interface ChallengeModel {
  pocketbase: PocketBase;
  challenges: (ChallengeData & PbBase)[];
}

type ChallengeSubmissionType = 'text' | 'url' | 'image' | 'commit';
type ChallengeCreateOptions = Partial<Omit<ChallengeData, 'id' | 'created' | 'updated'>>;

const ChallengeSubmission = () => {};

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
      .getOne<ChallengeData>(challengeId);
    return challenge;
  }

  async getAll() {
    const challenges = await this.pocketbase
      .collection('challenges')
      .getList(1, 100, { filter: 'inProgress=true' });
    return challenges;
  }

  async create(challenge: ChallengeCreateOptions) {
    const record = await this.pocketbase.collection('challenges').create<ChallengeData>(challenge);

    // TODO: send button to setup challenge
    return record;
  }

  async update(challenge: ChallengeCreateOptions & { id: string }) {
    return await this.pocketbase.collection('challenges').update(challenge.id, challenge);
  }

  async getFromChannel(channelId: string) {
    return this.challenges.find((c) => c.channelId === channelId);
  }

  async createSubmission(
    challengeId: string,
    userId: string,
    submissionType: ChallengeSubmissionType,
    value: string,
  ) {
    const record = await this.pocketbase.collection('challenge_entry').create<ChallengeData>({
      challenge: challengeId,
      type: submissionType,
      value,
      userId,
    });
    return record;
  }
}

export default ChallengeModel;
