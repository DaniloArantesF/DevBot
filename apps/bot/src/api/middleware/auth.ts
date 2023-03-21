import { Response, NextFunction } from 'express';
import { TBotApi } from 'shared/types';
import AuthController from '@/controllers/authController';

// TODO: add admin data
// TODO: check user has proper permissions
export async function authMiddleware(
  req: TBotApi.AuthenticatedRequest,
  res: Response,
  next: NextFunction,
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
  next();
}
