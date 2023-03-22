import { Router, Request, Response } from 'express';
import { PUBLIC_CLIENT_URL } from '@/utils/config';
import { APIRouter } from '@/api';
import { logger } from 'shared/logger';
import AuthController from '@/controllers/authController';

const AuthRouter: APIRouter = (pushRequest) => {
  const router = Router();
  logger.Debug('AuthRouter', `OAuth RedirectURL: ${PUBLIC_CLIENT_URL}/login`);

  /**
   * Fetches access token given an authorization code
   *
   * @route POST /auth/code
   * @apiparam {string} code Discord authorization code
   * @apiresponse {200} DiscordAuthResponse
   * @apiresponse {401} Unauthorized (no code provided)
   * @apiresponse {500} Internal Server Error (error fetching access token)
   */
  router.post('/login', async (req: Request, res: Response) => {
    async function handler() {
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
    pushRequest(req, handler);
  });

  return router;
};

export default AuthRouter;
