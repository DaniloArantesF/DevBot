import { TBotApi, TCache } from 'shared/types';
import { Request, Response } from 'express';
import { RequestLog } from '@/tasks/logs';

// **Note**: right now this needs to be the last decorator applied to a method
export function withApiLogging() {
  return function (target: any, key: string, descriptor?: PropertyDescriptor) {
    const originalMethod = descriptor?.value;
    descriptor!.value = async function (
      req: Request | TBotApi.AuthenticatedRequest,
      res: Response,
    ) {
      const originalSend = res.send.bind(res);
      let logged = false;
      let requestLog: TCache.Request | undefined;

      res.send = function (body?: any) {
        if (!logged) {
          requestLog = RequestLog(req.method, req.originalUrl, res.statusCode, body);
          logged = true;
        }
        return originalSend(body);
      };

      await originalMethod.apply(this, [req, res]);
      return requestLog;
    };
    return descriptor;
  };
}
