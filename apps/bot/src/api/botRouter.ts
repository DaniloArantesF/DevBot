import { Router, Request, Response } from 'express';
import { getCommands } from '../commands';
import { APIRouter } from '.';
import botProvider from '../index';
import DiscordClient from '../DiscordClient';
import { stringifyCircular } from '@utils/index';

const BotRouter: APIRouter = (pushRequest) => {
  const router = Router();

  router.get('/status', async (req: Request, res: Response) => {
    async function handler() {
      res.send('OK');
      return { status: 'OK' };
    }
    pushRequest(req, handler);
  });

  router.get('/commands', async (req: Request, res: Response) => {
    async function handler() {
      const commands = getCommands().map(({execute, ...data}) => (data));
      res.send(commands);
      return { commands };
    }
    pushRequest(req, handler);
  });

  router.get('/roles', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.query.guildId;
      if (!guildId) return res.status(400).send('Missing guildId');

      const discordClient = (await botProvider).getService('discordClient') as DiscordClient;

      const guild = discordClient.guilds.cache.get(guildId as string);
      if (!guild) return res.status(404).send('Guild not found');

      const roles = guild.roles.cache.map((role) => JSON.parse(stringifyCircular(role)));

      res.send(roles);
      return { roles };
    }
    pushRequest(req, handler);
  });

  return router;
};

export default BotRouter;
