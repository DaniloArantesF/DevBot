import type API from '../api/index';
import type DataProvider from '../DataProvider';
import type TaskManager from '../TaskManager';
import type DiscordClient from '../DiscordClient';
import type { VoiceConnection } from '@discordjs/voice';
import type { Client } from 'redis-om';
import type { ClientEvents } from 'discord.js';

// Shared types
export * from 'shared/types';

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
  getDiscordClient: () => DiscordClient;
  getTaskManager: () => typeof TaskManager;
  getDataProvider: () => typeof DataProvider;
  getApi: () => typeof API;
}

/*     DiscordClient Types     */
export interface DiscordConnection {
  connection: VoiceConnection;
}

export interface DiscordEvent<K extends keyof ClientEvents = any> {
  name: K;
  on?: (...args: ClientEvents[K]) => void | Promise<void>;
  once?: (...args: ClientEvents[K]) => void | Promise<void>;
}

/*     TaskManager Types     */
export interface QueueTaskData {
  id: string;
  result?: any;
  timestamp?: number;
}

export type apiHandler = (client?: DiscordClient) => Promise<void | any> | void;
export interface ApiTask {
  id: string;
  execute: apiHandler;
}

/*     DataProvider Models     */
export interface ModelRepository<I, O> {
  create(data: I): Promise<O>;
  get(args: Partial<I>): Promise<O>;
  getAll(): Promise<O[]>;
}

export type RepositoryBuilder = (client: Client) => Promise<Partial<ModelRepository<any, any>>>;
