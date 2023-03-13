/* -------------------------------- */
/*           Shared Config          */
/* -------------------------------- */
import type { TBot } from './bot';

export const BOT_CONFIG: TBot.Config = {
  prefix: '!',
  logLevel: 'debug',
  // *Note* The discord api requires a reply within 3 seconds. If cooldown is greater than 3000, you need to defer reply and edit it later.
  cooldownMs: 2500,
  autoProcess: true,
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

export const redirectURI = encodeURIComponent(`${PUBLIC_CLIENT_URL}/login`);

// Discord configuration
export const DISCORD_API_BASE_URL = 'https://discord.com/api';
export const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=712958072007688232&redirect_uri=${redirectURI}&response_type=code&scope=identify%20connections%20guilds`;
