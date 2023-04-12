/* -------------------------------- */
/*            Shared Types          */
/* -------------------------------- */
export * from './discord';
export * from './bot';
export * from './cache';
export * from './pocketbase';
export * from './api';
export * from './openai';
export * from './client';

// General
export type Factory<T> = (args?: Partial<T>) => T;
