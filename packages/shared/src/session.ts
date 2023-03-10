import type { IronSessionOptions } from 'iron-session';
import { TBotApi } from './api';

export type User = TBotApi.AuthData & TBotApi.UserData & { isLoggedIn: boolean };
export const sessionOptions: IronSessionOptions = {
  password:
    (process.env.SECRET_COOKIE_PASSWORD as string) ||
    'complex_password_at_least_32_characters_long',
  cookieName: 'bot-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// typings for req.session.*
declare module 'iron-session' {
  interface IronSessionData {
    user: User;
  }
}
