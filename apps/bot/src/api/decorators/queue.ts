import { TBotApi } from 'shared/types';
import { Request, Response } from 'express';
import apiController from '@/controllers/apiController';

export function useApiQueue(timeout?: number) {
  return function (target: any, key: string, descriptor?: PropertyDescriptor) {
    const originalMethod = descriptor?.value;
    descriptor!.value = async function (
      req: Request | TBotApi.AuthenticatedRequest,
      res: Response,
    ) {
      return await apiController.addTask({
        id: `${req.method}:${req.originalUrl}@${new Date().toISOString()}`,
        execute: () => originalMethod.apply(this, [req, res]),
        ...(timeout && { timeout }),
      });
    };
    return descriptor;
  };
}
