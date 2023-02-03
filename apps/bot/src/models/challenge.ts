import Pocketbase from 'pocketbase';
import { ChallengeData } from 'shared/src/pocketbase';

interface ChallengeModel {
  pocketbase: Pocketbase;
}

class ChallengeModel {
  constructor(pocketbase: Pocketbase) {
    this.pocketbase = pocketbase;
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
  }

  async create(challenge: Omit<ChallengeData, 'id' | 'created' | 'updated'>) {
    const record = (await this.pocketbase
      .collection('challenges')
      .create(challenge)) as ChallengeData;

    // TODO: send button to setup challenge
    return record;
  }

  async update(challenge: Omit<ChallengeData, 'created' | 'updated'>) {
    return await this.pocketbase.collection('challenges').update(challenge.id, challenge);
  }
}

export default ChallengeModel;
