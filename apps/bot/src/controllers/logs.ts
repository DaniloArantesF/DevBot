import botProvider from '@/index';
import { stringifyCircular } from '@/utils';
import type { RequestCacheData } from '@utils/types';

export async function getCommandLogs() {}

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
  } as RequestCacheData;
}
