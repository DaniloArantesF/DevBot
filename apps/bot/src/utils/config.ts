/** Default bot configuration **/
import { GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

// Host configuration
export const CLIENT_URL = 'http://localhost:3000';
export const REDIS_URL = 'redis://localhost:6379';
export const PORT = 8000;

// Discord configuration
export const PREFIX = '!';

// Environment variables
export const TOKEN = process.env.DISCORD_TOKEN;
export const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
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
