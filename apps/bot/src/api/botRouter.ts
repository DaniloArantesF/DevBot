import { Router, Request, Response } from 'express';
import { getCommands } from '@/tasks/commands';
import { APIRouter } from '@/api';
import { RequestLog } from '@/tasks/logs';
import botProvider from '..';
import { authMiddleware } from './middleware/auth';
import { TBotApi } from 'shared/types';

const BotRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Returns bot status
   *
   * @route GET /bot/status
   * @apiresponse {200} OK
   */
  router.get('/status', async (req: Request, res: Response) => {
    async function handler() {
      res.send('Online');
      return RequestLog(req.method, req.url, 200, 'OK');
    }
    pushRequest(req, handler);
  });

  /**
   * Returns bot commands
   *
   * @route GET /bot/commands
   * @apiresponse {200} Command[]
   */
  router.get('/commands', async (req: Request, res: Response) => {
    async function handler() {
      const commands = (await getCommands()).map(({ execute, ...data }) => data);
      res.send(commands);
      return RequestLog('get', req.url, 200, commands);
    }
    pushRequest(req, handler);
  });

  /**
   * Sets bot config for a guild
   * Updates the rolesChannel, userRoles and plugins
   * @route POST bot/config/:guildId
   */
  router.post('/config/:guildId', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    async function handler() {
      const rolesChannelId = req.body.rolesChannelId;
      const userRoles = req.body.userRoles;
      const plugins = req.body.plugins;
      const guildId = req.params.guildId;

      // At least one of the fields must be set
      if (!rolesChannelId && !userRoles && !plugins) {
        res.status(400).send('Missing at least one required field');
        return RequestLog('post', req.url, 400, 'Missing at least one required field');
      }

      const guildModel = (await botProvider).getDataProvider().guild;
      try {
        const updatedRecord = await guildModel.update({
          guildId: guildId as string,
          ...(rolesChannelId && { rolesChannelId }),
          ...(userRoles && { userRoles }),
          ...(plugins && { plugins }),
        });
        res.send(updatedRecord);
        return RequestLog(req.method, req.url, 200, updatedRecord);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error updating guild config.');
        return RequestLog(req.method, req.url, 500, error);
      }
    }
    pushRequest(req, handler);
  });

  /**
   * Returns guild roles available for users to self-assign
   *
   * @route GET /bot/config/:guildId/userRoles
   * @apiparam {string} guildId
   * @apiresponse {200} Role[]
   */
  router.get(
    '/config/:guildId/userRoles',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        const guildModel = (await botProvider).getDataProvider().guild;

        try {
          const guildRecord = await guildModel.get(req.params.guildId);
          const userRoles = guildRecord.userRoles;
          res.send({ userRoles });
          return RequestLog(req.method, req.url, 200, { userRoles });
        } catch (error) {
          res.status(404).send('Guild not found');
          return RequestLog(req.method, req.url, 404, 'Guild not found');
        }
      }
      pushRequest(req, handler);
    },
  );

  /**
   * Sets guild roles available for users to self-assign
   *
   * @route PUT /bot/config/:guildId/userRoles
   * @apiparam {string} guildId
   * @apiresponse {200} Role[]
   */
  router.put(
    '/config/:guildId/userRoles',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        const guildModel = (await botProvider).getDataProvider().guild;
        const newUserRoles = req.body.userRoles;

        if (!Array.isArray(newUserRoles)) {
          res.status(400).send('Missing or invalid userRoles array');
          return RequestLog(req.method, req.url, 400, 'Missing or invalid userRoles array');
        }

        try {
          const updatedRecord = await guildModel.update({
            guildId: req.params.guildId,
            userRoles: [...newUserRoles],
          });
          res.send({ userRoles: updatedRecord.userRoles });
        } catch (error: any) {
          res.status(error.status).send({ message: error.message })
          return RequestLog(req.method, req.url, error.status, error.message);
        }
      }
      pushRequest(req, handler);
    },
  );

  return router;
};

export default BotRouter;
