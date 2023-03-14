import { Router, Request, Response } from 'express';
import { DISCORD_API_BASE_URL } from '@/utils/config';
import fetch from 'node-fetch';
import type DiscordClient from '@/DiscordClient';
import type { TBotApi } from '@/utils/types';
import { APIRouter } from '@/api';
import { getGuild } from '@/tasks/guild';
import { getGuildRoles, setRolesMessage } from '@/tasks/roles';
import { stringifyCircular } from '@/utils';
import { getGuildChannels } from '@/tasks/channels';
import { RequestLog } from '@/tasks/logs';
import { APIConnection } from 'discord.js';
import botProvider from '..';
import { getUserGuilds } from '@/tasks/user';
import { authMiddleware } from './middleware/auth';
import { logger } from 'shared/logger';

const DiscordRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Returns the cached user data
   *
   * @route GET /api/discord/user
   * @apiparam {string} token
   * @apiresponse {200} UserData
   * @apiresponse {401} Unauthorized
   * @apiresponse {500}
   */
  router.get('/user', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    async function handler() {
      try {
        const data = req.discordUser;
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
  router.get('/user/connections', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    async function handler() {
      const token = req.discordAuth!.accessToken;

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
            } as TBotApi.UserConnectionData),
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
   * Returns guilds data from Discord
   *
   * @route GET /api/discord/guilds
   * @apiresponse {200} GuildData[]
   * @apiresponse {401} Unauthorized
   * @apiresponse {500}
   */
  router.get('/guilds', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    async function handler(client: DiscordClient) {
      try {
        const guilds = await getUserGuilds(req.discordUser!.id);
        res.send(guilds);
        return RequestLog(req.method, req.url, 200, guilds);
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return RequestLog(req.method, req.url, 500, null, error);
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
  router.get('/guilds/:guildId', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    async function handler(client: DiscordClient) {
      const guildId = req.params.guildId;
      const token = req.discordAuth!.accessToken;

      try {
        const guild = (await getGuild(guildId))?.toJSON() ?? {};
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
  router.get('/guilds/:guildId/roles', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    // TODO: check if user belongs to guild
    async function handler() {
      const guildId = req.params.guildId;
      const roles = (await getGuildRoles(guildId))?.map((role) =>
        JSON.parse(stringifyCircular(role)),
      );
      res.send(roles ?? []);
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
  router.get('/guilds/:guildId/channels', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    // TODO: check if user belongs to guild
    async function handler() {
      const guildId = req.params.guildId;
      const channels =
        (await getGuildChannels(guildId))?.map((channel) =>
          JSON.parse(stringifyCircular(channel)),
        ) ?? [];
      res.send(channels);
      return RequestLog('get', req.url, 200, channels);
    }
    pushRequest(req, handler);
  });

  /**
   * Sets guild roles available for users to self-assign
   *
   * @route PUT /discord/guilds/:guildId/roles
   * @apiparam {string} guildId
   * @apiresponse {200} Role[]
   */
  router.put('/guilds/:guildId/roles', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    async function handler() {
      const guildModel = (await botProvider).getDataProvider().guild;
      const guildRecord = await guildModel.get(req.params.guildId);

      if (!guildRecord) {
        res.status(404).send('Guild not found');
        return RequestLog('patch', req.url, 404, 'Guild not found');
      }

      let data = {};
      try {
        const updatedRecord = await guildModel.update({
          ...guildRecord,
          userRoles: [...req.body],
        });
        if (!updatedRecord || !updatedRecord.rolesChannelId) {
          logger.Warning('ApiController', `Roles channel not set for guild ${req.params.guildId}. Aborting role update.`);
          res.status(400).send('Roles channel not set');
          return;
        };
        const channelId = updatedRecord.rolesChannelId;
        const roleMessage = await setRolesMessage(req.params.guildId, channelId, req.body);
        data = { updatedRecord, roleMessage };
      } catch (error) {
        data = { error: stringifyCircular(error) };
      }

      res.send(data);
      return RequestLog(req.method, req.url, 200, data);
    }
    pushRequest(req, handler);
  });

  return router;
};

export default DiscordRouter;
