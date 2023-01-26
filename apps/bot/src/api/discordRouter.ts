import { Router, Request, Response } from 'express';
import { DISCORD_API_BASE_URL } from '@/utils/config';
import fetch from 'node-fetch';
import type DiscordClient from '@/DiscordClient';
import type { GuildData, UserData } from '@/utils/types';
import { APIRouter } from '.';
import { getGuild } from '@/controllers/guild';
import { getGuildRoles } from '@/controllers/roles';
import { stringifyCircular } from '@/utils';

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
      if (!token) return res.sendStatus(401);
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
        return data;
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return { error };
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
      if (!token) return res.sendStatus(401);
      try {
        const data = (await (
          await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
            method: 'GET',
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
        ).json()) as GuildData[];

        if (!data) return res.status(500).send([]);

        // Allowed flag is true if the bot is in the guild
        const guilds = data.map((g) => {
          return {
            ...g,
            allowed: Boolean(client.guilds.cache.get(g.id)),
          };
        });

        res.send(guilds);
        return guilds;
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return { error };
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
      if (!token) return res.sendStatus(401);
      try {
        const guild = (await getGuild(guildId)).toJSON();
        res.send(guild);
        return guild;
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return { error };
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
   * @apiresponse {400} Missing guildId
   */
  router.get('/guilds/:guildId/roles', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.params.guildId;
      if (!guildId) return res.status(400).send('Missing guildId');

      // if (!guild) return res.status(404).send('Guild not found');
      const roles = (await getGuildRoles(guildId)).map((role) =>
        JSON.parse(stringifyCircular(role)),
      );
      res.send(roles);
      return { roles };
    }
    pushRequest(req, handler);
  });

  return router;
};

export default DiscordRouter;
