import { Router, Request, Response } from 'express';
import { APIRouter } from '@/api';
import botProvider from '..';
import { RequestLog } from '@/tasks/logs';

const PluginRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Turns habit tracking plugin for a guild on or off
   *
   * @route POST /api/plugins/:status/habit-tracker
   * @apiresponse {200}
   * @apiresponse {400} Missing guildId
   * @apiresponse {500}
   */
  router.post('/:status/habit-tracker', async (req: Request, res: Response) => {
    async function handler() {
      const status = req.params.status;
      if (!req.body?.guildId) {
        res.status(400).send('Missing guildId');
        return;
      } else if (status !== 'enable' && status !== 'disable') {
        res.status(400).send('Invalid status');
        return;
      }
      const guildId = req.body.guildId;
      const habitController = (await botProvider).getTaskManager().habitTrackerController;

      try {
        let record;
        if (status === 'enable') record = await habitController.enable(guildId);
        else record = await habitController.disable(guildId);
        res.send(record);
        return RequestLog(req.method, req.url, 200, record);
      } catch (error) {
        console.error(`Error `, error);
        res.status(500).send(error);
        return RequestLog(req.method, req.url, 500, null, error);
      }
    }

    pushRequest(req, handler);
  });

  return router;
};

export default PluginRouter;
