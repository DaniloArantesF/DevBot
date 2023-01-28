import { Router, Request, Response } from 'express';
import { DISCORD_API_BASE_URL } from '@/utils/config';
import fetch from 'node-fetch';
import type DiscordClient from '@/DiscordClient';
import type { GuildData, UserConnectionData, UserData } from '@/utils/types';
import { APIRouter } from '@/api';
import { getGuild } from '@/tasks/guild';
import { getGuildRoles } from '@/tasks/roles';
import { stringifyCircular } from '@/utils';
import { getGuildChannels } from '@/tasks/channels';
import { RequestLog } from '@/tasks/logs';
import { APIConnection } from 'discord.js';

// TODO: properly handle errors from Discord API

const DiscordRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Fetches user data from Discord
   *
   * @route GET /api/discord/user
   * @apiparam {string} token
   * @apiresponse {200} UserData
   * @apiresponse {401} Unauthorized
   * @apiresponse {500}
   */
  router.get('/user', async (req: Request, res: Response) => {
    async function handler() {
      const token = req.query.token as string;
      if (!token) {
        res.sendStatus(401);
        return RequestLog('get', req.url, 401, 'No token provided');
      }

      try {
        const data = (await (
          await fetch(`${DISCORD_API_BASE_URL}/users/@me`, {
            method: 'GET',
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
        ).json()) as UserData;
        res.status(200).send(data);
        return RequestLog('get', req.url, 200, data);
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return RequestLog('get', req.url, 500, null, error);
      }
    }

    // Push to request queue
    pushRequest(req, handler);
  });

  /**
   * Fetches user connections data from Discord
   *
   * @route GET /api/discord/user/connections
   * @apiparam {string} token
   * @apiresponse {200} UserConnectionData[]
   * @apiresponse {401} Unauthorized
   * @apiresponse {500}
   */
  router.get('/user/connections', async (req: Request, res: Response) => {
    async function handler() {
      const token = req.query.token as string;
      if (!token) {
        res.sendStatus(401);
        return RequestLog('get', req.url, 401, 'No token provided');
      }

      try {
        const data = (await (
          await fetch(`${DISCORD_API_BASE_URL}/users/@me/connections`, {
            method: 'GET',
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
        ).json()) as APIConnection[];

        const payload = data.map(
          ({ id, type, name, visibility, verified, friend_sync, show_activity }) =>
            ({
              id,
              type,
              name,
              visibility,
              verified,
              friendSync: friend_sync,
              showActivity: show_activity,
            } as UserConnectionData),
        );
        res.status(200).send(payload);
        return RequestLog('get', req.url, 200, payload);
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return RequestLog('get', req.url, 500, null, error);
      }
    }

    // Push to request queue
    pushRequest(req, handler);
  });

  /**
   * Fetches guilds data from Discord
   *
   * @route GET /api/discord/guilds
   * @apiparam {string} token
   * @apiresponse {200} GuildData[]
   * @apiresponse {401} Unauthorized
   * @apiresponse {500}
   */
  router.get('/guilds', async (req: Request, res: Response) => {
    async function handler(client: DiscordClient) {
      const token = req.query.token as string;
      if (!token) {
        res.sendStatus(401);
        return RequestLog('get', req.url, 401, 'No token provided');
      }

      try {
        const data = (await (
          await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
            method: 'GET',
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
        ).json()) as GuildData[];

        if (!data) {
          res.sendStatus(500);
          return RequestLog('get', req.url, 500, 'No guild data');
        }

        // Allowed flag is true if the bot is in the guild
        const guilds = data.map((g) => {
          return {
            ...g,
            allowed: Boolean(client.guilds.cache.get(g.id)),
          };
        });

        res.send(guilds);
        return RequestLog('get', req.url, 200, guilds);
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return RequestLog('get', req.url, 500, null, error);
      }
    }

    // Push to request queue
    pushRequest(req, handler);
  });

  /**
   * Fetches guild data from Discord
   *
   * @route GET /api/discord/guilds/:guildId
   * @apiparam {string} token
   * @apiresponse {200} GuildData
   * @apiresponse {401} Unauthorized
   * @apiresponse {500}
   */
  router.get('/guilds/:guildId', async (req: Request, res: Response) => {
    async function handler(client: DiscordClient) {
      const guildId = req.params.guildId;
      const token = req.query.token as string;
      if (!token) {
        res.sendStatus(401);
        return RequestLog('get', req.url, 401, 'No token provided');
      }

      try {
        const guild = (await getGuild(guildId)).toJSON();
        res.send(guild);
        return RequestLog('get', req.url, 200, guild);
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return RequestLog('get', req.url, 500, null, error);
      }
    }

    // Push to request queue
    pushRequest(req, handler);
  });

  /**
   * Returns guild roles
   *
   * @route GET /discord/guilds/:guildId/roles
   * @apiparam {string} guildId
   * @apiresponse {200} Role[]
   */
  router.get('/guilds/:guildId/roles', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.params.guildId;

      // if (!guild) return res.status(404).send('Guild not found');
      const roles = (await getGuildRoles(guildId)).map((role) =>
        JSON.parse(stringifyCircular(role)),
      );
      res.send(roles);
      return RequestLog('get', req.url, 200, roles);
    }
    pushRequest(req, handler);
  });

  /**
   * Returns guild channels
   *
   * @route GET /discord/guilds/:guildId/channels
   * @apiparam {string} guildId
   * @apiresponse {200} GuildChannelJSON[]
   */
  router.get('/guilds/:guildId/channels', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.params.guildId;
      const channels = (await getGuildChannels(guildId)).map((channel) =>
        JSON.parse(stringifyCircular(channel)),
      );
      res.send(channels);
      return RequestLog('get', req.url, 200, channels);
    }
    pushRequest(req, handler);
  });
  return router;
};

export default DiscordRouter;
