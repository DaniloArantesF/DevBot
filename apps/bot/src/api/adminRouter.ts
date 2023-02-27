import { Router, Request, Response } from 'express';
import { APIRouter } from '@/api';
import {
  registerGlobalSlashCommands,
  registerGuildSlashCommands,
  deleteGlobalSlashCommands,
  deleteGuildSlashCommands,
} from '@/tasks/commands';
import { RequestLog } from '@/tasks/logs';
import { setRolesMessage } from '@/tasks/roles';
import { purgeChannel } from '@/tasks/channels';
import { stringifyCircular } from '@/utils';
import botProvider from '..';

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
        return RequestLog(req.method, req.url, 200, data);
      } catch (error) {
        console.error('Error registering slash commands: ', error);
        res.status(500).send(error);
        return RequestLog(req.method, req.url, 500, null, error);
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
        return RequestLog(req.method, req.url, 200, data);
      } catch (error) {
        console.error('Error purging slash commands: ', error);
        res.status(500).send(error);
        return RequestLog(req.method, req.url, 500, null, error);
      }
    }

    pushRequest(req, handler);
  });

  /**
   * Sets or updates the roles message for a guild
   *
   * @route POST /api/admin/roles/message
   * @apiparam {string} guildId
   * @apiresponse {200}
   * @apiresponse {400} Missing guildId or channelId
   * @apiresponse {500}
   */
  router.post('/roles/message', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.body?.guildId;
      const channelId = req.body?.channelId;

      if (!guildId || !channelId) {
        res.status(400).send('Missing guildId or channelId');
        return RequestLog(req.method, req.url, 400, null, 'Missing guildId or channelId');
      }

      try {
        const roles = (await ((await botProvider).getDataProvider()).guild.get(guildId)).userRoles;
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
  });

  /**
   * Purges a channel
   *
   * @route POST /api/admin/channel/purge
   * @apiparam {string} guildId
   * @apiparam {string} channelId
   * @apiresponse {200}
   * @apiresponse {400} Missing guildId or channelId
   * @apiresponse {500}
   */
  router.post('/channel/purge', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.body?.guildId;
      const channelId = req.body?.channelId;

      if (!guildId || !channelId) {
        res.status(400).send('Missing guildId or channelId');
        return RequestLog(req.method, req.url, 400, null, 'Missing guildId or channelId');
      }

      try {
        const data = await purgeChannel(guildId, channelId);
        res.sendStatus(200);
        return RequestLog(req.method, req.url, 200, data);
      } catch (error) {
        console.error('Error setting roles message', error);
        res.status(500).send(error);
        return RequestLog(req.method, req.url, 500, null, error);
      }
    }

    pushRequest(req, handler);
  });
  return router;
};

export default AdminRouter;
