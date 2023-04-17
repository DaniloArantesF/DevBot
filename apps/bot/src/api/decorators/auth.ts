import AuthController from '@/controllers/authManager';
import { Response } from 'express';
import { TBotApi } from 'shared/types';

type Role = 'admin' | 'user';

// Method descriptor
export function withAuth(role: Role[]) {
  return function (target: any, key: string, descriptor?: PropertyDescriptor) {
    const originalMethod = descriptor?.value;

    descriptor!.value = async function (
      req: TBotApi.AuthenticatedRequest,
      res: Response,
      ...args: any[]
    ) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader.split(' ').length !== 2) {
        return res.status(401).send({
          message: 'Invalid authorization header.',
        });
      }

      const authController = AuthController.getInstance();
      const token = authHeader.split(' ')[1];
      const payload = await authController.verifySessionToken(token);
      if (!payload) {
        return res.status(401).send({
          message: 'Invalid token.',
        });
      }

      req.userId = payload.userId;
      req.discordUser = payload.discordUser;
      req.discordAuth = payload.discordAuth;
      return originalMethod.apply(this, [req, res, ...args]);
    };
    return descriptor;
  };
}
