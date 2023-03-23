import { Router, Request, Response } from 'express';
import botProvider from '..';
import { TBotApi } from 'shared/types';
import { withAuth } from './decorators/auth';
import { useApiQueue } from './decorators/queue';
import { withApiLogging } from './decorators/log';

class PluginRouter {
  router = Router();
  constructor() {
    this.init();
  }

  init() {
    this.router.get('/', this.getPlugins.bind(this));
    this.router.post('/guilds/:guildId/:status', this.setStatus.bind(this));
    this.router.get('/guilds/:guildId', this.getGuildPlugins.bind(this));
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getPlugins(req: TBotApi.AuthenticatedRequest, res: Response) {
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

  @withAuth(['admin'])
  @useApiQueue()
  @withApiLogging()
  async setStatus(req: TBotApi.AuthenticatedRequest, res: Response) {
    const status = req.params.status;

    try {
      res.send({});
    } catch (error) {
      console.error(`Error `, error);
      res.status(500).send({ message: `Error updating plugin status.` });
    }
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getGuildPlugins(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildModel = (await botProvider).getDataProvider().guild;

    try {
      const guildRecord = await guildModel.get(req.params.guildId);
      const plugins = guildRecord.plugins;
      res.send({ plugins });
    } catch (error) {
      res.status(404).send('Guild not found');
    }
  }
}

const pluginRouter = new PluginRouter();
export default pluginRouter;
