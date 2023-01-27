import type API from '@/api/index';
import type DataProvider from '@/DataProvider';
import type TaskManager from '@/TaskManager';
import type DiscordClient from '@/DiscordClient';
import type { VoiceConnection } from '@discordjs/voice';
import type { Client } from 'redis-om';
import type { ClientEvents } from 'discord.js';
import type { EventCacheData } from '@/utils/types';
import type { RequestCacheData } from 'shared/types';
import type Queue from 'bee-queue';

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
  getTaskManager: () => ReturnType<typeof TaskManager>;
  getDataProvider: () => ReturnType<typeof DataProvider>;
  getApi: () => typeof API;
}

/*     DiscordClient Types     */
export interface DiscordConnection {
  connection: VoiceConnection;
}

export interface DiscordEvent<K extends keyof ClientEvents = any> {
  name: K;
  active?: boolean;

  on?: (...args: ClientEvents[K]) => void | Promise<void | EventCacheData>;
  once?: (...args: ClientEvents[K]) => void | Promise<void | EventCacheData>;
}

/*     TaskManager Types     */
export interface Controller<T, E> {
  queue: Queue<T>;
  taskMap: Map<string, E>;
  addTask: (...args: any) => Promise<Queue.Job<T>>;
  processTasks: (...args: any) => void;
  removeTask(id: string): Promise<void>;
}

export interface QueueTaskData {
  id: string;
  result?: string;
  timestamp?: number;
}

export type apiHandler = (client?: DiscordClient) => Promise<void | RequestCacheData> | void;
export interface ApiTask {
  id: string;
  execute: apiHandler;
}
export type EventTask = DiscordEvent & {
  args: any[];
};

/*     DataProvider Models     */
export interface ModelRepository<I, O> {
  create(data: I): Promise<O>;
  get(args: Partial<I>): Promise<O>;
  getAll(): Promise<O[]>;
}

export type RepositoryBuilder = (client: Client) => Promise<Partial<ModelRepository<any, any>>>;

// Shared types
export * from 'shared/types';
