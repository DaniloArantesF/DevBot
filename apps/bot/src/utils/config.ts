import { GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

export const TOKEN = process.env.DISCORD_TOKEN;
export const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const GUILD_ID = process.env.DISCORD_TEST_GUILD_ID;

export const INTENTS = [
  // Guilds
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessageReactions,

  // Privileged Intents
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.MessageContent,

  // Direct Messages
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageReactions,
];
