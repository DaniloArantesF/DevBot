import { TBotApi, TPocketbase } from 'shared/types';
import botProvider from '..';
import { getUserData, getUserToken } from '@/tasks/user';
import jwt from 'jsonwebtoken';
import UserModel from '@/models/user';
import { logger } from 'shared/logger';

class AuthController {
  private static instance: AuthController;
  config = {
    cookieName: 'benji-session',
    password: process.env.SESSION_COOKIE_PASSWORD || '',
    ttl: 1000 * 60 * 60 * 24, // 1 day
  };
  sessions = new Map<string, TBotApi.Session>(); // userId -> session
  userModel!: UserModel;

  private constructor() {
    this.init();
  }

  static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return this.instance;
  }

  async init() {
    this.userModel = (await botProvider).getDataProvider().user;
  }

  async createSession(code: string) {
    const data = await this.createOAuthUser(code);
    if (!data || !data.auth || !data.user) {
      return null;
    }

    const payload = {
      auth: data.auth,
      discordUser: data.user,
      userId: data.id,
    } as TBotApi.CookiePayload;

    const token = jwt.sign(payload, this.config.password, {
      expiresIn: this.config.ttl,
    });

    const session = {
      token,
      expiresAt: Date.now() + this.config.ttl,
    } as TBotApi.Session;

    this.sessions.set(data.user.id, session);
    return session;
  }

  async createOAuthUser(code: string) {
    try {
      const authData = await getUserToken(code);
      const userData = await getUserData(authData.accessToken);
      const data = {
        email: '',
        emailVisibility: false,
        password: userData.id,
        passwordConfirm: userData.id,
        username: userData.username,
        discordId: userData.id,
        avatar: userData.avatar,
        auth: authData,
        user: userData,
        isAdmin: false,
      } as TPocketbase.UserData;

      // Update or create user
      try {
        let userId: string;
        if (this.sessions.has(data.discordId)) {
          logger.Debug(
            'AuthController',
            `Updating user: ${data.username} (${data.discordId}) from cache`,
          );
          userId = (await this.verifySessionToken(this.sessions.get(data.discordId)!.token))!
            .userId;
        } else {
          logger.Debug(
            'AuthController',
            `Updating user: ${data.username} (${data.discordId}) from database`,
          );
          let userRecord = await this.userModel.getByDiscordId(data.discordId);
          userId = userRecord?.id;
        }

        return await this.userModel.update({ id: userId, ...data });
      } catch (error) {
        logger.Debug('AuthController', `Creating new user: ${data.username} (${data.discordId})`);
        return await this.userModel.create(data);
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async verifySessionToken(token: string) {
    try {
      const payload = jwt.verify(token, this.config.password) as TBotApi.CookiePayload;
      if (!payload?.discordUser?.id) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }

  async deleteSession(userId: string) {
    this.sessions.delete(userId);
  }
}

export default AuthController;
