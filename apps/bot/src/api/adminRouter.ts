import { Router, Request, Response } from 'express';
import { APIRouter } from '.';
import {
  registerGlobalSlashCommands,
  registerGuildSlashCommands,
  deleteGlobalSlashCommands,
  deleteGuildSlashCommands,
} from '../commands';

const AdminRouter: APIRouter = (pushRequest) => {
  const router = Router();

  // Register slash commands
  router.post('/register-commands', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.body?.guildId as string;
      try {
        let data = {};
        if (guildId) {
          data = await registerGuildSlashCommands(guildId);
        } else {
          data = await registerGlobalSlashCommands();
        }
        res.send(data);
        return data;
      } catch (error) {
        console.error('Error registering slash commands: ', error);
        res.status(500).send(error);
        return {};
      }
    }

    pushRequest(req, handler);
  });

  // Removes all slash commands
  // TODO: optionally remove all commands for all guilds individually
  router.post('/purge-commands', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.body?.guildId;
      try {
        let data = {};
        if (guildId) {
          data = await deleteGuildSlashCommands(guildId);
        } else {
          data = await deleteGlobalSlashCommands();
        }
        res.send(data);
        return data;
      } catch (error) {
        console.error('Error purging slash commands: ', error);
        res.status(500).send(error);
        return { error };
      }
    }

    pushRequest(req, handler);
  });

  return router;
};

export default AdminRouter;
