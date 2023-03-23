import { Router, Response } from 'express';
import {
  registerGlobalSlashCommands,
  registerGuildSlashCommands,
  deleteGlobalSlashCommands,
  deleteGuildSlashCommands,
} from '@/tasks/commands';
import { purgeChannel } from '@/tasks/channels';
import { TBotApi } from 'shared/types';
import { useApiQueue } from './decorators/queue';
import { withApiLogging } from './decorators/log';
import { withAuth } from './decorators/auth';

interface TAdminRouter {
  router: Router;
  init(): void;
  registerCommands(req: TBotApi.AuthenticatedRequest, res: Response): Promise<void>;
  deleteCommands(req: TBotApi.AuthenticatedRequest, res: Response): Promise<void>;
  purgeChannel(req: TBotApi.AuthenticatedRequest, res: Response): Promise<void>;
}

class AdminRouter implements TAdminRouter {
  router = Router();

  constructor() {
    this.init();
  }

  init() {
    this.router.post('/commands', this.registerCommands.bind(this));
    this.router.delete('/commands', this.deleteCommands.bind(this));
    this.router.post('/channel/purge', this.purgeChannel.bind(this)); // TODO: move to channelrouter
  }

  @withAuth(['admin'])
  @withApiLogging()
  @useApiQueue()
  async registerCommands(req: TBotApi.AuthenticatedRequest, res: Response) {
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

  @withAuth(['admin'])
  @withApiLogging()
  @useApiQueue()
  async deleteCommands(req: TBotApi.AuthenticatedRequest, res: Response) {
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

  @withAuth(['admin'])
  @withApiLogging()
  @useApiQueue()
  async purgeChannel(req: TBotApi.AuthenticatedRequest, res: Response) {
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
}

const adminRouter = new AdminRouter();
export default adminRouter;
