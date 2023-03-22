import { PermissionsString } from 'discord.js';
import type { Router, Request } from 'express';

export interface DiscordAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface UserDiscordResponse {
  id: string;
  username: string;
  avatar: string;
  avatar_decoration: string | null;
  bot?: boolean;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner: string | null;
  banner_color: string | null;
  accent_color: number | null;
  locale: string;
  mfa_enabled: boolean;
  premium_type: number;
}

export interface GuildDiscordData {
  allowed?: boolean;
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  features: string[];
  permissions: number;
  // permissions_new: string;
}

declare namespace TBotApi {
  type AuthData = {
    accessToken: string;
    expiresAt: number;
    refreshToken: string;
    scope: string;
    tokenType: string;
  };

  type UserData = Omit<
    UserDiscordResponse,
    | 'avatar_decoration'
    | 'banner_color'
    | 'accent_color'
    | 'mfa_enabled'
    | 'premium_type'
    | 'public_flags'
  > & {
    accentColor: number | null;
    avatarDecoration: string | null;
    bannerColor: string | null;
    mfaEnabled: boolean;
    premiumType: number;
    publicFlags: number;
  };

  export type CookiePayload = {
    userId: string; // pb user id
    discordAuth: AuthData;
    discordUser: UserData;
  };

  export type AuthenticatedRequest = Request & Partial<CookiePayload>;

  export type Session = {
    token: string;
    expiresAt: number;
  };

  type UserConnectionData = {
    friendSync: boolean;
    id: string;
    name: string;
    showActivity: boolean;
    type: string;
    verified: boolean;
    visibility: number;
  };

  type GuildData = {
    id: string;
    name: string;
    icon: string | null;
    isOwner: boolean;
    features: string[];
    permissions: PermissionsString[];
    isOwner: boolean;
  };

  type ChannelData = {
    createdTimestamp: number;
    flags: number;
    guildId: string;
    id: string;
    name: string;
    parentId: string | null;
    rawPosition: number;
    type: number;
  };

  /* Api Response types  */
  type BasicResponse = {
    message: string;
  };
  type ErrorResponse = BasicResponse;

  type GetUserResponse = UserData;
  type GetUserConnectionsResponse = UserConnectionData[];
  type GetChannelsResponse = ChannelData[];
  type CreateChannelResponse = ChannelData;
  type DeleteChannelResponse = BasicResponse;
}

export interface TRouter {
  router: Router;
}

type RequestHandler = (...args: any[]) => Promise<void> | void;

// TODO: include typing for Request Request<{}, {}, SetConfigBody>
export interface TBotRouter {
  getStatus: RequestHandler;
  getCommands: RequestHandler;
  setConfig: RequestHandler;
}

export interface TGuildRouter {
  getGuilds: RequestHandler;
  getUserRoles: RequestHandler;
  setUserRoles: RequestHandler;
}

export type { TBotApi };
