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

interface DataProvider {
  botProvider: Awaited<BotProvider>;
  redis: Client;
  pocketbase: PocketBase;
  guild: ReturnType<typeof GuildRepository>;
  challenge: ChallengeModel;
  user: UserModel;
}

class PocketBase extends PocketBaseSDK {
  isAdmin: boolean | Promise<boolean>;
  constructor() {
    super(POCKETBASE_BASE_URL);
    this.isAdmin = this.authenticate();
  }

  async authenticate() {
    try {
      const adminData = await this.admins.authWithPassword(
        POCKETBASE_ADMIN_EMAIL,
        POCKETBASE_ADMIN_PASSWORD,
      );
      // this.authStore.save(adminData.token, adminData.admin);
      return true;
    } catch (error) {
      console.log('Error authenticating with PocketBase', error);
      return false;
    }
  }
}

class DataProvider {
  constructor(botProvider: Awaited<BotProvider>) {
    this.botProvider = botProvider;
    this.redis = new Client();
    this.pocketbase = new PocketBase();
    this.user = new UserModel(this.pocketbase);
    this.challenge = new ChallengeModel(this.pocketbase);
  }

  async connect() {
    // Create a connection to redis
    if (!this.redis.isOpen()) {
      await this.redis.open(REDIS_URL);
    }
    this.guild = GuildRepository(this.botProvider);
    await this.pocketbase.isAdmin;
  }

  async cleanUp() {}
}

export default DataProvider;
