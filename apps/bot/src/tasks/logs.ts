import { stringifyCircular } from '@/utils';
import type { TCache } from '@utils/types';
import { CommandInteractionOption } from 'discord.js';

export async function RequestLog(
  method: string,
  url: string,
  status: number,
  data?: any,
  error?: any,
) {
  return {
    method,
    url,
    status,
    data: stringifyCircular(data) || '',
    error: stringifyCircular(error) || '',
  } as TCache.Request;
}

export async function EventLog(event: string, data?: any, error?: any) {
  return {
    event,
    data: stringifyCircular(data) || '',
    error: stringifyCircular(error) || '',
  } as TCache.Event;
}

export async function CommandLog(
  command: string,
  args: string[] | CommandInteractionOption[],
  reply: string,
  data?: any,
  error?: any,
) {
  return {
    command,
    args,
    reply,
    data: stringifyCircular(data) || '',
    error: stringifyCircular(error) || '',
  } as TCache.Command;
}

// TODO
export async function getCommandLogs() {}
export async function getGuildLogs(guildId: string) {}
