import { Router, Request, Response } from 'express';
import { getCommands } from '@/tasks/commands';
import { APIRouter } from '@/api';
import { RequestLog } from '@/tasks/logs';

const BotRouter: APIRouter = (pushRequest) => {
  const router = Router();

  /**
   * Returns bot status
   *
   * @route GET /api/bot/status
   * @apiresponse {200} OK
   */
  router.get('/status', async (req: Request, res: Response) => {
    async function handler() {
      res.send('OK');
      return RequestLog('get', req.url, 200, 'OK');
    }
    pushRequest(req, handler);
  });

  /**
   * Returns bot commands
   *
   * @route GET /api/bot/commands
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

  return router;
};

export default BotRouter;
