import { Router, Request, Response } from 'express';
import { APIRouter } from '@/api';
import botProvider from '..';
import { authMiddleware } from './middleware/auth';
import { TBotApi } from 'shared/types';

const PluginRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Returns a list of all plugins
   * @route GET /plugins
   */
  router.get('/', async (req: Request, res: Response) => {
    async function handler() {
      const taskManager = (await botProvider).getTaskManager();
      const plugins = taskManager.plugins;
      try {
        const pluginIds = plugins.map((p) => p.id);
        res.send(pluginIds);
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
      }
    }

    pushRequest(req, handler);
  });

  /**
   * Updates plugin status for a guild
   *
   * @route POST /plugins/guilds/:guildId/:status
   * @apiresponse {200}
   * @apiresponse {500}
   */
  // TODO
  router.post(
    '/guilds/:guildId/:status',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        const status = req.params.status;

        try {
          res.send({});
        } catch (error) {
          console.error(`Error `, error);
          res.status(500).send({ message: `Error updating plugin status.` });
        }
      }

      pushRequest(req, handler);
    },
  );

  /**
   * Returns guild plugins enabled
   *
   * @route GET /plugins/guilds/:guildId
   * @apiresponse {200}
   * @apiresponse {500}
   */
  router.get(
    '/guilds/:guildId',
    authMiddleware,
    async (req: TBotApi.AuthenticatedRequest, res: Response) => {
      async function handler() {
        const guildModel = (await botProvider).getDataProvider().guild;

        try {
          const guildRecord = await guildModel.get(req.params.guildId);
          const plugins = guildRecord.plugins;
          res.send({ plugins });
        } catch (error) {
          res.status(404).send('Guild not found');
        }
      }

      pushRequest(req, handler);
    },
  );

  return router;
};

export default PluginRouter;
