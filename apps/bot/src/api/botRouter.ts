import { Router, Request, Response } from 'express';
import { getCommands } from '@/tasks/commands';
import { TBotApi, TBotRouter, TPocketbase } from 'shared/types';
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
    this.router.post('/:guildId/userRoles/purge', this.purgeUserRoles.bind(this));
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

    // Validate userRoles
    if (!newUserRoles) {
      res.status(400).send('Missing userRoles');
      return;
    }
    if (!validateUserRoles(newUserRoles)) {
      res.status(400).send('Invalid userRoles array');
      return;
    }

    try {
      const updatedRecord = await guildModel.update({
        guildId: req.params.guildId,
        userRoles: [...newUserRoles],
      });

      // Update roles message
      // await bot.updateRolesMessage(updatedRecord);

      res.send({ userRoles: updatedRecord.userRoles });
    } catch (error: any) {
      res.status(error.status).send({ message: error.message });
    }
  }

  @withAuth(['admin'])
  @useApiQueue()
  @withApiLogging()
  async purgeUserRoles(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildId = req.params.guildId as string;
    try {
      const guild = await dataProvider.guild.get(guildId);
      await bot.purgeUserRoles(guild);
      res.sendStatus(200);
    } catch (error: any) {
      res.status(error.status ?? 500).send({ message: error.message });
    }
  }
}

// TODO: add more helpful error messages
function validateUserRoles(userRoles: any): userRoles is TPocketbase.UserRoleItem[] {
  // Make sure its an array
  if (!Array.isArray(userRoles)) {
    return false;
  }

  function checkItem(item: any): item is TPocketbase.UserRoleItem {
    return (
      typeof item.name === 'string' &&
      typeof item.description === 'string' &&
      typeof item.emoji === 'string' &&
      typeof item.position === 'number' &&
      typeof item.category === 'string' &&
      (!item.hasChannel || typeof item.hasChannel === 'boolean') &&
      (!item.color || typeof item.color === 'string')
    );
  }

  // Make sure all items are valid
  for (const item of userRoles) {
    if (!checkItem(item)) {
      return false;
    }
  }

  return true;
}

const botRouter = new BotRouter();
export default botRouter;
