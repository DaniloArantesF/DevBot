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
import { createGuildSnapshot, getGuild } from '@/tasks/guild';
import { LogLevel, logger } from 'shared/logger';
import dataProvider from '@/DataProvider';
import { setBotRole } from '@/tasks/roles';

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
    this.router.get('/:guildId/templates', this.getGuildTemplates.bind(this));
    this.router.post('/:guildId/roles/bot', this.setBotRole.bind(this));
    this.router.post('/:guildId/snapshot', this.createGuildSnapshot.bind(this));
    this.router.post('/logLevel', this.setLogLevel.bind(this));
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

  @withAuth(['admin'])
  @withApiLogging()
  @useApiQueue()
  async getGuildTemplates(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildId = req.params?.guildId;
    const guild = getGuild(guildId);
    if (!guild) return res.status(404).send('Guild not found');
    const templates = await guild?.fetchTemplates();
    res.send(templates || {});
  }

  @withAuth(['admin'])
  @withApiLogging()
  @useApiQueue()
  async setLogLevel(req: TBotApi.AuthenticatedRequest, res: Response) {
    const levelKey = req.body?.level as string;
    const level = LogLevel[levelKey as keyof typeof LogLevel];
    if (!level) {
      res.status(400).send('Missing or invalid level');
      return;
    }
    logger.setLevel(level);
    res.sendStatus(200);
  }

  @withAuth(['admin'])
  @withApiLogging()
  @useApiQueue()
  async setBotRole(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildId = req.params.guildId as string;
    const guild = getGuild(guildId);
    if (!guild) return res.status(404).send('Guild not found');
    await setBotRole(guild);
    res.sendStatus(200);
  }

  @withAuth(['admin'])
  @withApiLogging()
  @useApiQueue()
  async createGuildSnapshot(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildId = req.params.guildId as string;

    try {
      const snapshot = await createGuildSnapshot(guildId)!;
      if (!snapshot) {
        res.sendStatus(500);
        logger.Error('AdminRouter', `Error creating guild snapshot for ${guildId}`);
        return;
      }

      // Save to db

      const snapshotRecord = await dataProvider.guild.createSnapshot(snapshot!);
      res.send(snapshotRecord);
    } catch (error: any) {
      logger.Error('AdminRouter', 'Error creating guild snapshot');
      console.error(error);
      res.send(error.message || error);
    }
  }
}

const adminRouter = new AdminRouter();
export default adminRouter;
