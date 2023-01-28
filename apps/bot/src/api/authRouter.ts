import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { CLIENT_URL, DISCORD_API_BASE_URL, CLIENT_ID, CLIENT_SECRET } from '@/utils/config';
import type { ApiAuthResponse, DiscordAuthResponse } from '@/utils/types';
import { APIRouter } from '@/api';
import { RequestLog } from '@/tasks/logs';

const AuthRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Fetches access token given an authorization code
   *
   * @route POST /api/auth/code
   * @apiparam {string} code Discord authorization code
   * @apiresponse {200} DiscordAuthResponse
   * @apiresponse {401} Unauthorized (no code provided)
   * @apiresponse {500} Internal Server Error (error fetching access token)
   */
  router.post('/code', async (req: Request, res: Response) => {
    async function handler() {
      const code = req.body?.code;
      if (!code) {
        res.sendStatus(401);
        return RequestLog('post', req.url, 401, 'No code provided');
      }

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
              scope:
                'identify connections activities.read applications.commands.permissions.update guilds guilds.members.read applications.commands role_connections.write',
            }),
          })
        ).json();

        const { access_token, refresh_token, expires_in, token_type, scope } =
          data as DiscordAuthResponse;

        res.status(200).send({
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: Date.now() + expires_in,
          tokenType: token_type,
          scope,
        } as ApiAuthResponse);

        return RequestLog('post', req.url, 200, data);
      } catch (error) {
        console.error(`Error fetching access token w/ code ${code}`, error);
        res.status(500).send(error);
        return RequestLog('post', req.url, 500, null, error);
      }
    }

    pushRequest(req, handler);
  });

  /**
   * Refreshes access token given a refresh token
   *
   * @route POST /api/auth/refresh
   * @apiparam {string} refreshToken Discord refresh token
   * @apiresponse {200} DiscordAuthResponse
   * @apiresponse {401} Unauthorized (no refresh token provided)
   * @apiresponse {500} Internal Server Error (error fetching access token)
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    async function handler() {
      const refreshToken = req.body?.refreshToken;
      if (!refreshToken) {
        res.sendStatus(401);
        return RequestLog('post', req.url, 401, 'No refresh token provided');
      }

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

        const { access_token, refresh_token, expires_in, token_type, scope } =
          data as DiscordAuthResponse;

        res.status(200).send({
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: Date.now() + expires_in,
          tokenType: token_type,
          scope,
        } as ApiAuthResponse);

        return RequestLog('post', req.url, 200, data);
      } catch (error) {
        res.status(500).send(error);
        return RequestLog('post', req.url, 500, null, error);
      }
    }

    pushRequest(req, handler);
  });

  return router;
};

export default AuthRouter;
