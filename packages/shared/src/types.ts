/* -------------------------------- */
/*            Shared Types          */
/* -------------------------------- */
export * from './discord.d';
export * from './bot.d';
export * from './cache.d';
export * from './pocketbase.d';
export * from './api.d';
export * from './openai.d';
export * from './client.d';

// General
export type Factory<T> = (args?: Partial<T>) => T;
