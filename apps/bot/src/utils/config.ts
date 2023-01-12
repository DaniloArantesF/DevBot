/** Default bot configuration **/
import { GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

// Host configuration
export const CLIENT_URL = 'http://localhost:3000';
export const REDIS_URL = 'redis://localhost:6379';
export const PORT = 8000;
export const redirectURI = encodeURIComponent(`${CLIENT_URL}/login`);

// Discord configuration
export const PREFIX = '!';
export const DISCORD_API_BASE_URL = 'https://discord.com/api';
export const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=712958072007688232&permissions=8&redirect_uri=${redirectURI}&response_type=code&scope=identify%20guilds`;

// Environment variables
export const TOKEN = process.env.DISCORD_TOKEN;
export const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const GUILD_ID = process.env.DISCORD_TEST_GUILD_ID;

export const INTENTS = [
  // Guilds
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessageReactions,

  // Privileged intents
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.MessageContent,

  // Direct messages
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageReactions,
];


// Bot configuration
export const ENVIRONMENT = process.env.NODE_ENV ?? 'dev';

export const BOT_CONFIG = {
  // *Note* The discord api requires a reply within 3 seconds. If cooldown is greater than 3000, you need to defer reply and edit it later.
  cooldownMs: 2500,
}