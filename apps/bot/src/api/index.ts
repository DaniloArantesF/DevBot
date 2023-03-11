import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import AdminRouter from '@/api/adminRouter';
import { CLIENT_URL, ENVIRONMENT, API_PORT } from '@config';
import AuthRouter from '@/api/authRouter';
import DiscordRouter from '@/api/discordRouter';
import type { apiHandler, BotProvider } from '@/utils/types';
import BotRouter from '@/api/botRouter';
import PluginRouter from './pluginRouter';
import { logger } from 'shared/logger';

export type APIRouter = (
  pushRequest: (req: Request, execute: apiHandler) => void,
) => express.Router;

/**
 * API
 * @param provider BotProvider
 */
function API(provider: BotProvider) {
  const api = express();
  const server = http.createServer(api);
  const rootRouter = express.Router();
  const apiController = provider.getTaskManager().apiController;
  const routers = {
    '/': rootRouter,
    '/bot': BotRouter(pushRequest),
    '/admin': AdminRouter(pushRequest),
    '/auth': AuthRouter(pushRequest),
    '/discord': DiscordRouter(pushRequest),
    '/plugins': PluginRouter(pushRequest),
  };

  function setupRoutes() {
    for (const [path, router] of Object.entries(routers)) {
      api.use(path, router);
    }

    // Status route, does not go through task manager
    rootRouter.get('/status', async (req: Request, res: Response) => res.send('Online'));
  }

  function setupMiddleware() {
    api.use(express.urlencoded({ extended: true }));
    api.use(express.json());
    api.use(cors());
    api.options(
      '*',
      cors({
        origin: ['*'], //[CLIENT_URL],
        methods: ['GET', 'POST'],
      }),
    );
    api.use(morgan(ENVIRONMENT === 'dev' ? 'dev' : 'combined'));

    // Rate limit requests - 10/sec
    api.use(
      rateLimit({
        windowMs: 1000,
        max: 10,
        message: 'Too many requests',
        headers: true,
      }),
    );
  }

  function pushRequest(req: Request, execute: apiHandler) {
    apiController.addTask({
      id: `${req.method}:${req.originalUrl}@${new Date().toISOString()}`,
      execute,
    });
  }

  // Setup server and listen for connections
  setupMiddleware();
  setupRoutes();
  server.listen(API_PORT, () => {
    logger.Info('API', `Listening on port ${API_PORT}`);
  });

  return { api, server, routers };
}

export default API;
