import { Router, Request, Response } from 'express';
import taskManager from '../TaskManager';
import { DISCORD_API_BASE_URL } from '@utils/config';
import fetch from 'node-fetch';
import type { DiscordClient } from '../DiscordClient';
const { addApiRequest } = taskManager;

interface GuildData {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: number;
  features: string[];
  permissions_new: string;
}

function DiscordRouter() {
  const router = Router();

  // Fetches user data from discord
  router.get('/user', async (req: Request, res: Response) => {
    async function handler() {
      const token = req.query.token as string;
      if (!token) return res.sendStatus(401);
      try {
        const data = await (
          await fetch(`${DISCORD_API_BASE_URL}/users/@me`, {
            method: 'GET',
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
        ).json();

        return res.status(200).send(data);
      } catch (error) {
        console.error(`Error `, error);
        return res.status(500).send(error);
      }
    }

    await addApiRequest({ id: req.rawHeaders.toString(), execute: handler });
  });

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

        // Allowed flag is true if the bot is in the guild
        const guilds = data.map((g) => {
          return {
            ...g,
            allowed: Boolean(client.guilds.cache.get(g.id)),
          };
        });

        return res.send(guilds);
      } catch (error) {
        console.error(`Error `, error);
        return res.status(500).send(error);
      }
    }

    await addApiRequest({ id: req.rawHeaders.toString(), execute: handler });
  });

  return router;
}

export default DiscordRouter;
