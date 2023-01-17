import type API from '../api/index';
import type DataProvider from '../DataProvider';
import type TaskManager from '../TaskManager';
import type DiscordClient from '../DiscordClient';
import type { Response } from 'express';
import type { VoiceConnection } from '@discordjs/voice';
import type { Client } from 'redis-om';
import type { ClientEvents } from 'discord.js';
import type { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export interface BotProvider {
  services: Partial<{
    [key: string]: any;
    discordClient: DiscordClient;
    api: typeof API;
    dataProvider: typeof DataProvider;
    taskManager: typeof TaskManager;
  }>;
  addService: (name: string, service: any) => void;
  getService: (name: string) => any;
}

/*     DiscordClient Types     */
export interface DiscordConnection {
  connection: VoiceConnection;
}

// Make some properties optional
export type DiscordCommandData = Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> &
  Partial<SlashCommandBuilder>;

// TODO: add other command types e.g. context
export interface DiscordCommand {
  aliases?: string[];
  args?: boolean;
  data: DiscordCommandData;
  execute: (interaction: CommandInteraction) => Promise<void>;
  permissions?: string[];
  usage?: string;
}

export interface DiscordEvent<K extends keyof ClientEvents = any> {
  name: K;
  on?: (...args: ClientEvents[K]) => void | Promise<void>;
  once?: (...args: ClientEvents[K]) => void | Promise<void>;
}

/*     TaskManager Types     */
export interface QueueTaskData {
  id: string;
}
export type apiHandler = (client?: DiscordClient) => Promise<void | Response> | void;
export interface ApiTask {
  id: string;
  execute: apiHandler;
}

/*     Discord Data Types     */
// Serializable types for storing data
export interface UserData {
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

export interface GuildData {
  allowed?: boolean;
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: number;
  features: string[];
  permissions_new: string;
}

/*     Data Model Types     */
export interface ModelRepository<I, O> {
  create(data: I): Promise<O>;
  get(args: Partial<I>): Promise<O>;
  getAll(): Promise<O[]>;
}

export type RepositoryBuilder = (client: Client) => Promise<Partial<ModelRepository<any, any>>>;
