import { Router, Request, Response } from 'express';
import {
  registerGlobalSlashCommands,
  registerGuildSlashCommands,
  deleteGlobalSlashCommands,
  deleteGuildSlashCommands,
} from '../SlashCommands';
import { botProvider } from '../index';

function AdminRouter() {
  const router = Router();

  // Register slash commands
  router.post('/register-commands', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.body?.guildId;
      try {
        let data = {};
        if (guildId) {
          data = await registerGuildSlashCommands(guildId);
        } else {
          data = await registerGlobalSlashCommands();
        }
        res.send(data);
      } catch (error) {
        console.error('Error registering slash commands: ', error);
        res.status(500).send(error);
      }
    }

    (await botProvider)
      .getService('taskManager')
      .addApiRequest({ id: req.rawHeaders.toString(), execute: handler });
  });

  // Removes all slash commands
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
      } catch (error) {
        console.error('Error purging slash commands: ', error);
        res.status(500).send(error);
      }
    }

    (await botProvider)
      .getService('taskManager')
      .addApiRequest({ id: req.rawHeaders.toString(), execute: handler });
  });

  return router;
}

export default AdminRouter;
