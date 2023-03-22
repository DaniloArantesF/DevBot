import { Router, Request, Response } from 'express';
import { getCommands } from '@/tasks/commands';
import botProvider from '..';
import { TBotApi, TBotRouter } from 'shared/types';
import { withAuth } from './decorators/auth';
import { useApiQueue } from './decorators/queue';
import { withApiLogging } from './decorators/log';

class BotRouter implements TBotRouter {
  router = Router();
  constructor() {
    this.init();
  }

  init() {
    this.router.get('/status', this.getStatus.bind(this));
    this.router.get('/commands', this.getCommands.bind(this));
    this.router.put('/config/:guildId', this.setConfig.bind(this));
  }

  @withApiLogging()
  async getStatus(req: Request, res: Response) {
    res.sendStatus(200);
  }

  @useApiQueue()
  @withApiLogging()
  async getCommands(req: Request, res: Response) {
    const commands = await getCommands();
    res.send(commands);
  }

  @withAuth(['admin'])
  @useApiQueue()
  @withApiLogging()
  async setConfig(req: TBotApi.AuthenticatedRequest, res: Response) {
    const rolesChannelId = req.body.rolesChannelId;
    const userRoles = req.body.userRoles;
    const plugins = req.body.plugins;
    const guildId = req.params.guildId;

    // At least one of the fields must be set
    if (!rolesChannelId && !userRoles && !plugins) {
      res.status(400).send({
        message: 'Missing at least one required field',
      });
      return;
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
    } catch (error) {
      console.error(error);
      res.status((error as any)?.status ?? 500).send({
        message: 'Failed to update guild config',
      });
    }
  }
}

const botRouter = new BotRouter();
export default botRouter;
