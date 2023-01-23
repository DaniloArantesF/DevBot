import { Router, Request, Response } from 'express';
import { DISCORD_API_BASE_URL } from '@utils/config';
import fetch from 'node-fetch';
import type DiscordClient from '../DiscordClient';
import type { GuildData, UserData } from 'shared/types';
import { APIRouter } from '.';
import botProvider from '../index';

const DiscordRouter: APIRouter = (pushRequest) => {
  const router = Router();

  // Fetches user data from discord
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

  // Fetches a single guild from discord
  router.get('/guilds/:guildId', async (req: Request, res: Response) => {
    async function handler(client: DiscordClient) {
      const guildId = req.params.guildId;
      const token = req.query.token as string;
      if (!token) return res.sendStatus(401);
      try {
        const discordClient = (await botProvider).getDiscordClient();
        const guild = await (await discordClient.getGuild(guildId)).toJSON();

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

  // Fetches user guilds from discord
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

  return router;
};

export default DiscordRouter;
