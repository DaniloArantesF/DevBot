import { Client } from 'redis-om';
import { REDIS_URL } from 'shared/config';
import GuildRepository from './models/guild';
import type { BotProvider } from '@utils/types';
import PocketBaseSDK from 'pocketbase';
import UserModel from './models/user';
import {
  POCKETBASE_ADMIN_EMAIL,
  POCKETBASE_ADMIN_PASSWORD,
  POCKETBASE_BASE_URL,
} from '@/utils/config';
import ChallengeModel from './models/challenge';
import { logger } from 'shared/logger';

interface DataProvider {
  botProvider: Awaited<BotProvider>;
  redis: Client;
  pocketbase: PocketBase;
  guild: ReturnType<typeof GuildRepository>;
  challenge: ChallengeModel;
  user: UserModel;
}

export class PocketBase extends PocketBaseSDK {
  isAdmin: boolean | Promise<boolean>;

  constructor() {
    super(POCKETBASE_BASE_URL);
    this.isAdmin = this.authenticate();
  }

  async authenticate() {
    try {
      await this.admins.authWithPassword(POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

class DataProvider {
  constructor(botProvider: Awaited<BotProvider>) {
    this.botProvider = botProvider;
    this.pocketbase = new PocketBase();
    this.challenge = new ChallengeModel(this.pocketbase);
    this.redis = new Client();

    logger.Header(
      ['Data Provider Config', '', `Pocketbase: ${POCKETBASE_BASE_URL}`, `Redis: ${REDIS_URL}`],
      'minimal',
    );
  }

  async connect() {
    // Create a connection to redis
    if (!this.redis.isOpen()) {
      await this.redis.open(REDIS_URL);
    }

    await this.pocketbase.isAdmin;
    if (!this.pocketbase || !this.pocketbase.isAdmin) {
      throw new Error('Error authenticating with Pocketbase.');
    }

    this.guild = GuildRepository(this.botProvider);
    this.user = new UserModel(this.pocketbase);
  }

  async cleanUp() {}
}

export default DataProvider;
