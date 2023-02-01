/** Default bot configuration **/
import { GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

// Export shared configuration
export * from 'shared/config';

// Environment variables
export const TOKEN = process.env.DISCORD_TOKEN;
export const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const GUILD_ID = process.env.DISCORD_TEST_GUILD_ID;

export const POCKETBASE_BASE_URL = process.env.POCKETBASE_BASE_URL;
export const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
export const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

export const INTENTS = [
  // Guilds
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildScheduledEvents,

  // Privileged intents
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.MessageContent,

  // Moderation
  GatewayIntentBits.GuildBans,
  GatewayIntentBits.AutoModerationConfiguration,
  GatewayIntentBits.AutoModerationExecution,

  // Direct messages
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageReactions,
];

// Bot configuration
export const ENVIRONMENT = process.env.NODE_ENV ?? 'dev';

// Tasks configuration
export const AUTO_PROCESS = true;
