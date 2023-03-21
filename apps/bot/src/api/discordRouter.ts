import { Router, Request, Response } from 'express';
import { DISCORD_API_BASE_URL } from '@/utils/config';
import fetch from 'node-fetch';
import type DiscordClient from '@/DiscordClient';
import type { TBotApi } from '@/utils/types';
import { APIRouter } from '@/api';
import { getGuild } from '@/tasks/guild';
import { getGuildRoles, setRolesMessage } from '@/tasks/roles';
import { stringifyCircular } from '@/utils';
import { createChannel, deleteChannel, getGuildChannel, getGuildChannels } from '@/tasks/channels';
import { RequestLog } from '@/tasks/logs';
import { APIConnection, ChannelType } from 'discord.js';
import botProvider from '..';
import { getUserGuilds } from '@/tasks/user';
import { authMiddleware } from './middleware/auth';
import { logger } from 'shared/logger';
import { getGuildMember } from '@/tasks/members';

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
        const data = req.discordUser!;
        res.status(200).send(data as TBotApi.GetUserResponse);
        return RequestLog('get', req.url, 200, data);
      } catch (error: any) {
        console.error(`Error `, error);
        res
          .status(500)
          .send({ message: error?.message || 'Error fetching user data' } as TBotApi.ErrorResponse);
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
  router.get(
    '/user/connections',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
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

          const payload: TBotApi.UserConnectionData[] = data.map(
            ({ id, type, name, visibility, verified, friend_sync, show_activity }) => ({
              id,
              type,
              name,
              visibility,
              verified,
              friendSync: friend_sync,
              showActivity: show_activity,
            }),
          );
          res.status(200).send(payload as TBotApi.GetUserConnectionsResponse);
          return RequestLog('get', req.url, 200, payload);
        } catch (error: any) {
          console.error(`Error `, error);
          res
            .status(500)
            .send({
              message: error?.message || 'Error fetching user data',
            } as TBotApi.ErrorResponse);
          return RequestLog('get', req.url, 500, null, error);
        }
      }

      // Push to request queue
      pushRequest(req, handler);
    },
  );

  /**
   * Returns guilds data from Discord
   *
   * @route GET /discord/user/guilds
   * @apiresponse {200} GuildData[]
   * @apiresponse {401} Unauthorized
   * @apiresponse {500}
   */
  router.get(
    '/user/guilds',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
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
    },
  );

  /**
   * Fetches guild data from Discord
   *
   * @route GET /discord/guilds/:guildId
   * @apiparam {string} token
   * @apiresponse {200} GuildData
   * @apiresponse {401} Unauthorized
   * @apiresponse {500}
   */
  router.get(
    '/guilds/:guildId',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler(client: DiscordClient) {
        const guildId = req.params.guildId;
        const guild = await getGuild(guildId);

        if (!guild) {
          res.status(404).send('Guild not found');
          return RequestLog(req.method, req.url, 404, null);
        }

        if (!guild.members.cache.has(req.discordUser!.id)) {
          res.status(403).send({ message: 'Forbidden' });
          return RequestLog(req.method, req.url, 403, null);
        }

        res.send(guild);
        return RequestLog(req.method, req.url, 200, guild);
      }

      // Push to request queue
      pushRequest(req, handler);
    },
  );

  /**
   * Returns all guild roles
   *
   * @route GET /discord/guilds/:guildId/roles
   * @apiparam {string} guildId
   * @apiresponse {200} Role[]
   */
  router.get(
    '/guilds/:guildId/roles',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
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
    },
  );

  /**
   * Sets or updates the roles message for a guild
   *
   * @route POST /api/admin/roles/message
   * @apiparam {string} guildId
   * @apiresponse {200}
   * @apiresponse {400} Missing guildId or channelId
   * @apiresponse {500}
   */
  router.post(
    '/guilds/:guildId/roles/message',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        const guildId = req.params.guildId;
        const channelId = req.body?.channelId;
        const guild = await getGuild(guildId);

        if (!guild) {
          res.status(404).send('Guild not found');
          return RequestLog(req.method, req.url, 404, null);
        }

        // TODO: check that guild is valid & that user is guild admin
        if (!channelId) {
          res.status(400).send('Missing guildId or channelId');
          return RequestLog(req.method, req.url, 400, null, 'Missing guildId or channelId');
        }

        try {
          const roles = (await (await botProvider).getDataProvider().guild.get(guildId)).userRoles;
          const data = await setRolesMessage(guildId, channelId, roles);
          res.send(stringifyCircular(data));
          return RequestLog(req.method, req.url, 200, data);
        } catch (error) {
          console.error('Error setting roles message', error);
          res.status(500).send(error);
          return RequestLog(req.method, req.url, 500, null, error);
        }
      }

      pushRequest(req, handler);
    },
  );

  /**
   * Returns guild channels
   *
   * @route GET /discord/guilds/:guildId/channels
   * @apiparam {string} guildId
   * @apiresponse {200} GuildChannelJSON[]
   */
  router.get(
    '/guilds/:guildId/channels',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        const guildId = req.params.guildId;
        const guild = await getGuild(guildId);

        if (!guild) {
          res.status(404).send('Guild not found');
          return RequestLog(req.method, req.url, 404, null);
        }

        // Check that user is in guild
        if (!guild.members.cache.has(req.discordUser!.id)) {
          res.status(403).send('Forbidden');
          return RequestLog(req.method, req.url, 403, null);
        }

        const channels = await getGuildChannels(guildId);

        if (!channels) {
          res.status(404).send('Guild not found');
          return RequestLog(req.method, req.url, 404, null);
        }

        // const guildMember = await getGuildMember(guildId, req.discordUser!.id)!;
        const channelData: TBotApi.ChannelData[] = channels.map(
          ({ id, name, createdTimestamp, flags, guildId, parentId, type, ...channel }) => ({
            createdTimestamp: createdTimestamp ?? 0,
            flags: flags.toJSON(),
            guildId,
            id,
            name,
            parentId,
            rawPosition: 0,
            type,
          }),
        );

        res.send({
          channels: channelData,
        });
        return RequestLog(req.method, req.url, 200, channelData);
      }
      pushRequest(req, handler);
    },
  );

  /**
   * Creates a new channel in a guild
   */
  router.post(
    '/guilds/:guildId/channel',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        let reply;
        let channelType: ChannelType;
        const guildId = req.params.guildId;
        const guild = await getGuild(guildId);
        const channelName = req.body?.channelName as string;
        let channelParent = req.body?.channelParent as string;

        // Check that guild exists
        if (!guild) {
          reply = 'Guild not found';
          res.status(404).send(reply);
          return RequestLog(req.method, req.url, 404, reply);
        }

        // Get channel type
        switch (req.body?.channelType) {
          case 'GUILD_TEXT':
            channelType = ChannelType.GuildText;
            break;
          case 'GUILD_VOICE':
            channelType = ChannelType.GuildVoice;
            break;
          case 'GUILD_CATEGORY':
            channelType = ChannelType.GuildCategory;
            channelParent = '';
            break;
          default:
            reply = 'Invalid channel type';
            res.status(400).send(reply);
            return RequestLog(req.method, req.url, 400, reply);
        }

        if (channelParent) {
          // Check that parent channel exists
          const parentChannel = await getGuildChannel(guildId, channelParent);
          if (!parentChannel || parentChannel.type !== ChannelType.GuildCategory) {
            reply = 'Invalid parent channel';
            res.status(404).send(reply);
            return RequestLog(req.method, req.url, 404, reply);
          }
        }

        try {
          const channel = await createChannel(guildId, {
            name: channelName,
            type: channelType,
            ...(channelParent && { parent: channelParent }),
          });

          const channelData: TBotApi.ChannelData = {
            createdTimestamp: channel.createdTimestamp,
            flags: 0,
            guildId: channel.guildId,
            id: channel.id,
            name: channel.name,
            parentId: channel.parent?.id ?? null,
            rawPosition: channel.rawPosition,
            type: channel.type,
          };

          res.send(channelData as TBotApi.CreateChannelResponse);
          return RequestLog(req.method, req.url, 200, channelData);
        } catch (error) {
          reply = 'Error creating channel';
          logger.Error('APIController', reply);
          console.error(error);
          res.status(500).send({ message: reply });
          return RequestLog(req.method, req.url, 500, reply, error);
        }
      }

      pushRequest(req, handler);
    },
  );

  router.delete(
    '/guilds/:guildId/channel',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        let reply;
        const guildId = req.params.guildId;
        const channelId = req.body?.channelId as string;

        if (!channelId) {
          reply = 'Missing channelId';
          res.status(400).send(reply);
          return RequestLog(req.method, req.url, 400, reply);
        }

        // Check that guild exists
        const guild = await getGuild(guildId);
        if (!guild) {
          reply = 'Guild not found';
          res.status(404).send(reply);
          return RequestLog(req.method, req.url, 404, reply);
        }

        try {
          await deleteChannel(guildId, channelId);
          reply = 'Ok';
          res.send({ message: reply });
          return RequestLog(req.method, req.url, 200, reply);
        } catch (error) {
          reply = 'Error deleting channel';
          logger.Error('APIController', reply);
          console.error(error);
          res.status(500).send({ message: reply });
          return RequestLog(req.method, req.url, 500, reply, error);
        }
      }

      pushRequest(req, handler);
    },
  );

  return router;
};

export default DiscordRouter;
