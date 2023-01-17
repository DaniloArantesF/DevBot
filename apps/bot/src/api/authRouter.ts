import { Router, Request, Response } from 'express';
import { CLIENT_URL, DISCORD_API_BASE_URL, CLIENT_ID, CLIENT_SECRET } from '@utils/config';
import fetch from 'node-fetch';
import { botProvider } from '../index';

function AuthRouter() {
  const router = Router();

  // Fetches access token given a code
  router.post('/code', async (req: Request, res: Response) => {
    async function handler() {
      const code = req.body?.code;
      if (!code) return res.sendStatus(401);
      try {
        const data = await (
          await fetch(`${DISCORD_API_BASE_URL}/oauth2/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              code,
              grant_type: 'authorization_code',
              redirect_uri: `${CLIENT_URL}/login`,
              scope: 'identify',
            }),
          })
        ).json();

        return res.status(200).send(data);
      } catch (error) {
        console.error(`Error fetching access token w/ code ${code}`, error);
        return res.status(500).send(error);
      }
    }

    (await botProvider)
      .getService('taskManager')
      .addApiRequest({ id: req.rawHeaders.toString(), execute: handler });
  });

  // Refreshes access token given a refresh token
  router.post('/refresh', async (req: Request, res: Response) => {
    async function handler() {
      const refreshToken = req.body?.refreshToken;
      if (!refreshToken) return res.sendStatus(401);

      try {
        const data = await (
          await fetch(`${DISCORD_API_BASE_URL}/oauth2/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }),
          })
        ).json();

        return res.status(200).send(data);
      } catch (error) {
        console.error(`Error refreshing tokens`, error);
        return res.status(500).send(error);
      }
    }

    (await botProvider)
      .getService('taskManager')
      .addApiRequest({ id: req.rawHeaders.toString(), execute: handler });
  });

  return router;
}

export default AuthRouter;
