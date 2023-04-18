import dataProvider from '@/DataProvider';
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

      // Verify that the token is valid
      const authController = AuthController.getInstance();
      const token = authHeader.split(' ')[1];
      const payload = await authController.verifySessionToken(token);
      if (!payload) {
        return res.status(401).send({
          message: 'Invalid token.',
        });
      }

      // Verify that the user has the correct role
      // Right now it only checks for admin
      if (role.includes('admin') && !role.includes('user')) {
        const userDiscordId = payload.discordUser.id;
        const isAdmin = dataProvider.user.admins.has(userDiscordId);
        if (!isAdmin) {
          return res.status(403).send({
            message: 'You do not have permission to access this resource.',
          });
        }
      }

      req.userId = payload.userId;
      req.discordUser = payload.discordUser;
      req.discordAuth = payload.discordAuth;
      return originalMethod.apply(this, [req, res, ...args]);
    };
    return descriptor;
  };
}
