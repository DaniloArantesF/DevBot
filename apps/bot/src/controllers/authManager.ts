import { TBotApi, TPocketbase } from 'shared/types';
import { getUserData, getUserToken } from '@/tasks/user';
import jwt from 'jsonwebtoken';
import UserModel from '@/models/user';
import { logger } from 'shared/logger';
import dataProvider from '@/DataProvider';

class AuthController {
  private static instance: AuthController;
  config = {
    cookieName: 'benji-session',
    password: process.env.SESSION_COOKIE_PASSWORD || '',
    ttl: 1000 * 60 * 60 * 24 * 1, // 1 day
  };
  sessions = new Map<string, TBotApi.Session>(); // discordUserId -> session
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
    this.userModel = dataProvider.user;
  }

  async createSession(code: string) {
    const data = await this.createOAuthUser(code);
    if (!data || !data?.discordAuth?.accessToken || !data?.discordUser?.id) {
      return null;
    }

    const payload = {
      discordAuth: data.discordAuth,
      discordUser: data.discordUser,
      userId: data.id,
    } as TBotApi.CookiePayload;

    const token = jwt.sign(payload, this.config.password, {
      expiresIn: data.discordAuth.expiresAt - Date.now(),
    });

    const session = {
      token,
      expiresAt: data.discordAuth.expiresAt,
    } as TBotApi.Session;

    this.sessions.set(data.discordUser.id, session);
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
        avatar: '',
        discordAuth: authData,
        discordUser: userData,
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

  /**
   * Verifies a session token. Returns null if token is invalid or expired.
   * @param token Token to be verfieid
   * @returns {TBotApi.CookiePayload | null}
   */
  async verifySessionToken(token: string) {
    try {
      const payload = jwt.verify(token, this.config.password) as TBotApi.CookiePayload;

      const isExpired = Date.now() > payload.discordAuth.expiresAt;
      if (!payload?.discordUser?.id || isExpired) {
        if (this.sessions.get(payload.discordUser.id)) this.deleteSession(payload.discordUser.id);
        return null;
      }
      return payload;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  deleteSession(userId: string) {
    this.sessions.delete(userId);
  }
}

export default AuthController;