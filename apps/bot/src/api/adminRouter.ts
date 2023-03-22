import { Router, Request, Response } from 'express';
import { APIRouter } from '@/api';
import {
  registerGlobalSlashCommands,
  registerGuildSlashCommands,
  deleteGlobalSlashCommands,
  deleteGuildSlashCommands,
} from '@/tasks/commands';
import { purgeChannel } from '@/tasks/channels';
import { authMiddleware } from './middleware/auth';
import { TBotApi } from 'shared/types';

const AdminRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Registers slash commands globally or for a specific guild
   *
   * @route POST /admin/register-commands
   * @apiparam {string} guildId
   * @apiresponse {200} SlashCommandBuilder[]
   * @apiresponse {500}
   */
  router.post(
    '/register-commands',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
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
        } catch (error) {
          console.error('Error registering slash commands: ', error);
          res.status(500).send(error);
        }
      }

      pushRequest(req, handler);
    },
  );

  /**
   * Removes slash commands globally or for a specific guild
   *
   * @route POST /admin/purge-commands
   * @apiparam {string} guildId
   * @apiresponse {200} SlashCommandBuilder[]
   * @apiresponse {500}
   */
  // TODO: optionally remove all commands for all guilds individually
  router.post(
    '/purge-commands',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
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

      pushRequest(req, handler);
    },
  );

  /**
   * Purges a channel
   *
   * @route POST /admin/channel/purge
   * @apiparam {string} guildId
   * @apiparam {string} channelId
   * @apiresponse {200}
   * @apiresponse {400} Missing guildId or channelId
   * @apiresponse {500}
   */
  router.post(
    '/channel/purge',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        const guildId = req.body?.guildId;
        const channelId = req.body?.channelId;

        if (!guildId || !channelId) {
          res.status(400).send('Missing guildId or channelId');
          return;
        }

        try {
          const data = await purgeChannel(guildId, channelId);
          res.sendStatus(200);
        } catch (error) {
          console.error('Error setting roles message', error);
          res.status(500).send(error);
        }
      }

      pushRequest(req, handler);
    },
  );
  return router;
};

export default AdminRouter;
