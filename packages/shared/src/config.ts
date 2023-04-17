/* -------------------------------- */
/*           Shared Config          */
/* -------------------------------- */
import type { TBot } from './bot';
import { LogLevel } from './logger';
import Discord from 'discord.js';

export const BOT_CONFIG: TBot.Config = {
  motherGuildId: '1093214494592872448', // TODO: move to env
  prefix: '!',
  logLevel: LogLevel.debug,
  // *Note* The discord api requires a reply within 3 seconds. If cooldown is greater than 3000, you need to defer reply and edit it later.
  cooldownMs: 2500,

  autoProcess: true, // Whether to automatically process tasks
  autoSetup: true, // Whether to automatically perform setup tasks
  loadPlugins: false, // Whether to load plugins on init

  globalModerationConfig: {
    language: {
      enabled: true,
      allowed: ['en'],
      roleExceptions: [],
    },
    content: {
      enabled: false,
      allowed: [],
      roleExceptions: [],
    },
  },
};

export const ENV = process.env.NODE_ENV;

// Host configuration
export const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
export const CLIENT_HOSTNAME = process.env.CLIENT_HOSTNAME || 'localhost';
export const CLIENT_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL || `http://${CLIENT_HOSTNAME}:${CLIENT_PORT}`;
export const PUBLIC_CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL;

export const API_HOSTNAME =
  process.env.API_HOSTNAME || ENV === 'production' ? 'localhost' : 'localhost';
export const API_PORT = process.env.API_PORT || 3001;

export const BOT_URL = `http://${API_HOSTNAME}:${API_PORT}`;
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || BOT_URL;

export const REDIS_HOSTNAME = process.env.REDIS_HOSTNAME || '127.0.0.1';
export const REDIS_PORT = process.env.REDIS_PORT || 6379;
export const REDIS_URL = `redis://${REDIS_HOSTNAME}:${REDIS_PORT}`;

export const redirectURI = encodeURIComponent(`${PUBLIC_CLIENT_URL}/`);

// Discord configuration
export const DISCORD_API_BASE_URL = 'https://discord.com/api';
export const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=712958072007688232&redirect_uri=${redirectURI}&response_type=code&scope=identify%20connections%20guilds`;
export const DISCORD_BOT_AUTHORIZE_LINK =
  'https://discord.com/api/oauth2/authorize?client_id=712958072007688232&permissions=8&scope=bot';

type ColorName = keyof typeof Discord.Colors;

// List of colors with acceptable contrast ratios
export const contrastColors = [
  'Default',
  'White',
  'Aqua',
  'Green',
  'Blue',
  'Yellow',
  'Purple',
  'LuminousVividPink',
  'Fuchsia',
  'Gold',
  'Orange',
  'Red',
  'Grey',
  'DarkAqua',
  'DarkGreen',
  'DarkPurple',
  'DarkVividPink',
  'DarkGold',
  'DarkOrange',
  'DarkRed',
  'LightGrey',
  'Blurple',
  'Greyple',
] as ColorName[];
