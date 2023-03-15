import { Router, Request, Response } from 'express';
import { APIRouter } from '@/api';
import botProvider from '..';
import { RequestLog } from '@/tasks/logs';
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
        return RequestLog(req.method, req.url, 200, pluginIds);
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return RequestLog(req.method, req.url, 500, null, error);
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
  router.post('/guilds/:guildId/:status', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    async function handler() {
      const status = req.params.status;

      try {
        res.send({});
        return RequestLog(req.method, req.url, 200, {});
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send({ message: `Error updating plugin status.` });
        return RequestLog(req.method, req.url, 500, null, error);
      }
    }

    pushRequest(req, handler);
  });

  /**
   * Returns guild plugins enabled
   *
   * @route GET /plugins/guilds/:guildId
   * @apiresponse {200}
   * @apiresponse {500}
   */
  router.get('/guilds/:guildId', authMiddleware, async (req: TBotApi.AuthenticatedRequest, res: Response) => {
    async function handler() {
      const guildModel = (await botProvider).getDataProvider().guild;

      try {
        const guildRecord = await guildModel.get(req.params.guildId);
        const plugins = guildRecord.plugins;
        res.send({ plugins });
        return RequestLog(req.method, req.url, 200, { plugins });
      } catch (error) {
        res.status(404).send('Guild not found');
        return RequestLog(req.method, req.url, 404, 'Guild not found');
      }
    }

    pushRequest(req, handler);
  });

  return router;
};

export default PluginRouter;
