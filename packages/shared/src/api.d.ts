import type { Request } from 'express';

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
  // permissions: number;
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
    avatarDecoration: string | null;
    bannerColor: string | null;
    accentColor: number | null;
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
    id: string;
    type: string;
    name: string;
    visibility: number;
    friendSync: boolean;
    showActivity: boolean;
    verified: boolean;
  };

  type GuildData = Omit<GuildDiscordData, 'permissions_new'> & { permissionsNew: string };
}

export type { TBotApi };
