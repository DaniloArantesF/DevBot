import { Client } from 'redis-om';
import { REDIS_URL } from 'shared/config';
import GuildRepository from './models/guild';
import PocketBaseSDK, { Collection } from 'pocketbase';
import UserModel from './models/user';
import {
  POCKETBASE_ADMIN_EMAIL,
  POCKETBASE_ADMIN_PASSWORD,
  POCKETBASE_BASE_URL,
} from '@/utils/config';
import ChallengeModel from './models/challenge';
import { logger } from 'shared/logger';
import dbSchema from '../pb_schema.json';

interface DataProvider {
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
      logger.Info('DataProvider', 'Successfull Pocketbase login.');
      return true;
    } catch (error) {
      /** New pocketbase setup */
      logger.Info('DataProvider', 'Trying to create admin account ...');
      await this.admins.create({
        email: POCKETBASE_ADMIN_EMAIL,
        password: POCKETBASE_ADMIN_PASSWORD,
        passwordConfirm: POCKETBASE_ADMIN_PASSWORD,
      });

      try {
        await this.admins.authWithPassword(POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD);

        // Import schema
        logger.Debug('DataProvider', 'Creating schema tables ...');
        await this.collections.import(dbSchema as Collection[]);
        await this.settings.update({
          appName: 'Benji-DB',
        });

        return true;
      } catch (error) {
        logger.Error('DataProvider', 'Error creating Pocketbase admin account.');
        throw error;
      }
    }
  }

  async oAuthSign(code: string, verifier: string, redirectUri: string) {
    return await this.collection('users').authWithOAuth2('discord', code, verifier, redirectUri);
  }
}

class DataProvider {
  constructor() {
    logger.Info('DataProvider', 'Initializing ...');
    this.pocketbase = new PocketBase();
    this.redis = new Client();
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

    this.challenge = new ChallengeModel(this.pocketbase);
    this.guild = GuildRepository(this.pocketbase);
    this.user = new UserModel(this.pocketbase);
  }

  async cleanUp() {}
}

const dataProvider = new DataProvider();
export default dataProvider;
