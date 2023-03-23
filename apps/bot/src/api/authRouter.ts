import { Router, Request, Response } from 'express';
import { PUBLIC_CLIENT_URL } from '@/utils/config';
import { logger } from 'shared/logger';
import AuthController from '@/controllers/authController';
import { useApiQueue } from './decorators/queue';
import { withApiLogging } from './decorators/log';

class AuthRouter {
  router = Router();

  constructor() {
    this.init();
    logger.Debug('AuthRouter', `OAuth RedirectURL: ${PUBLIC_CLIENT_URL}/login`);
  }

  init() {
    this.router.post('/login', this.login.bind(this));
  }

  @useApiQueue()
  @withApiLogging()
  async login(req: Request, res: Response) {
    const authController = AuthController.getInstance();
    const { code } = req.body;

    if (!code) {
      res.sendStatus(401);
      return;
    }

    const data = await authController.createSession(code);
    if (!data) {
      res.sendStatus(500);
      return;
    }

    res.status(200).send(data);
  }
}

const authRouter = new AuthRouter();
export default authRouter;
