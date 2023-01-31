/*     Discord Data Types     */
import type {
  SlashCommandBuilder,
  CommandInteraction,
  Message,
  RoleData,
  CommandInteractionOption,
  MessageComponentInteraction,
} from 'discord.js';

export interface DiscordCommand {
  aliases?: string[];
  args?: boolean;
  data: DiscordCommandData;
  execute: SlashCommandHandler;
  permissions?: string[];
  usage?: string;
  buttonHandler?: ButtonCommandHandler;
  messageHandler?: MessageCommandHandler;
}

export type DiscordCommandHandler =
  | SlashCommandHandler
  | ButtonCommandHandler
  | MessageCommandHandler;

export type MessageCommandHandler = (interaction: Message) => Promise<void | CommandCacheData>;

export type ButtonCommandHandler = (
  interaction: MessageComponentInteraction,
) => Promise<void | CommandCacheData>;

export type SlashCommandHandler = (
  interaction: CommandInteraction,
) => Promise<void | CommandCacheData>;

export interface DiscordRoleData extends RoleData {}

// Type containing data for a command
export type Command = Omit<DiscordCommand, 'execute'>;

// Type returned by discord.js builder
export type DiscordCommandData = Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> &
  Partial<SlashCommandBuilder>;

// Serializable data for caching
interface BaseCacheData {
  user?: string;
  channel?: string;
  guild?: string;
  data?: string;
  error?: string;
}

export type CommandCacheData = BaseCacheData & {
  command: string;
  args: string[] | CommandInteractionOption[];
  reply: string;
};

export type RequestCacheData = BaseCacheData & {
  method: string;
  status: number;
  url: string;
};

export type EventCacheData = BaseCacheData & {
  event: string;
};

// ---------------------------- Discord API Types ----------------------------
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

export interface UserConnectionData {
  id: string;
  type: string;
  name: string;
  visibility: number;
  friendSync: boolean;
  showActivity: boolean;
  verified: boolean;
}

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
