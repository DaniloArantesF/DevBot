/*     Discord Data Types     */
// Generally returned by APIs and used to store data
// Discord returns snake_case, map to camelCase because this is the way?

export interface DiscordAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface ApiAuthResponse {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
  scope: string;
  tokenType: string;
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

export type UserData = Omit<
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

export interface GuildDiscordData {
  allowed?: boolean;
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: number;
  features: string[];
  permissions_new: string;
}

export type GuildData = Omit<GuildDiscordData, 'permissions_new'> & { permissionsNew: string };
