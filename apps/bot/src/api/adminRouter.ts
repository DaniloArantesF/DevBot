import { Router, Request, Response } from 'express';
import { APIRouter } from '@/api';
import {
  registerGlobalSlashCommands,
  registerGuildSlashCommands,
  deleteGlobalSlashCommands,
  deleteGuildSlashCommands,
} from '@/controllers/commands';
import { RequestLog } from '@/controllers/logs';

const AdminRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Registers slash commands globally or for a specific guild
   *
   * @route POST /api/admin/register-commands
   * @apiparam {string} guildId
   * @apiresponse {200} SlashCommandBuilder[]
   * @apiresponse {500}
   */
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
        return RequestLog('post', req.url, 200, data);
      } catch (error) {
        console.error('Error registering slash commands: ', error);
        res.status(500).send(error);
        return RequestLog('post', req.url, 500, null, error);
      }
    }

    pushRequest(req, handler);
  });

  /**
   * Removes slash commands globally or for a specific guild
   *
   * @route POST /api/admin/purge-commands
   * @apiparam {string} guildId
   * @apiresponse {200} SlashCommandBuilder[]
   * @apiresponse {500}
   */
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
        return RequestLog('post', req.url, 200, data);
      } catch (error) {
        console.error('Error purging slash commands: ', error);
        res.status(500).send(error);
        return RequestLog('post', req.url, 500, null, error);
      }
    }

    pushRequest(req, handler);
  });

  return router;
};

export default AdminRouter;
