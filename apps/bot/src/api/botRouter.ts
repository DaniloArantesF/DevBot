import { Router, Request, Response } from 'express';
import { getCommands } from '@/tasks/commands';
import { TBotApi, TBotRouter } from 'shared/types';
import { withAuth } from './decorators/auth';
import { useApiQueue } from './decorators/queue';
import { withApiLogging } from './decorators/log';
import dataProvider from '@/DataProvider';
import bot from '..';

class BotRouter implements TBotRouter {
  router = Router();
  constructor() {
    this.init();
  }

  init() {
    this.router.get('/status', this.getStatus.bind(this));
    this.router.get('/commands', this.getCommands.bind(this));
    // this.router.get('/config/:guildId', this.getConfig.bind(this));
    this.router.put('/config/:guildId', this.setConfig.bind(this));
    this.router.get('/config/:guildId/userRoles', this.getUserRoles.bind(this));
    this.router.put('/config/:guildId/userRoles', this.setUserRoles.bind(this));
    this.router.get('/config/:guildId/export', this.getGuildConfigExport.bind(this));
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

    const guildModel = dataProvider.guild;
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

  @withAuth(['admin'])
  @useApiQueue()
  @withApiLogging()
  async getGuildConfigExport(req: TBotApi.AuthenticatedRequest, res: Response) {
    const data = await bot.exportGuildConfig(req.params.guildId);
    if (data) {
      res.send({ ...data });
    } else {
      res.status(404).send('Invalid guildId');
    }
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getUserRoles(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildModel = dataProvider.guild;

    try {
      const guildRecord = await guildModel.get(req.params.guildId);
      const userRoles = guildRecord.userRoles;
      res.send({ userRoles });
    } catch (error) {
      res.status(404).send('Guild not found');
    }
  }

  @withAuth(['admin'])
  @useApiQueue()
  @withApiLogging()
  async setUserRoles(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildModel = dataProvider.guild;
    const newUserRoles = req.body.userRoles;

    if (!Array.isArray(newUserRoles)) {
      res.status(400).send('Missing or invalid userRoles array');
      return;
    }

    try {
      const updatedRecord = await guildModel.update({
        guildId: req.params.guildId,
        userRoles: [...newUserRoles],
      });
      res.send({ userRoles: updatedRecord.userRoles });
    } catch (error: any) {
      res.status(error.status).send({ message: error.message });
    }
  }
}

const botRouter = new BotRouter();
export default botRouter;
