import { TBotApi } from 'shared/types';
import { Request, Response, NextFunction } from 'express';
import { RequestLog } from '@/tasks/logs';

export function withApiLogging() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (req: Request | TBotApi.AuthenticatedRequest, res: Response) {
      const originalSend = res.send.bind(res);
      let logged = false;

      res.send = function (body?: any) {
        if (!logged) {
          const requestLog = RequestLog(req.method, req.originalUrl, res.statusCode, body);
          // console.log(requestLog); // TODO
          logged = true;
        }
        return originalSend(body);
      };

      return await originalMethod.apply(this, [req, res]);
    };
    return descriptor;
  };
}
