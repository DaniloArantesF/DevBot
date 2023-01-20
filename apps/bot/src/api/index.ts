import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import AdminRouter from './adminRouter';
import { CLIENT_URL, ENVIRONMENT, PORT } from '@config';
import AuthRouter from './authRouter';
import DiscordRouter from './discordRouter';
import type { apiHandler, BotProvider } from '@utils/types';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

export type APIRouter = (
  pushRequest: (req: Request, execute: apiHandler) => void,
) => express.Router;

// TODO: improve API error handling

/**
 * API
 * @param provider BotProvider
 */
function API(provider: BotProvider) {
  const api = express();
  const server = http.createServer(api);
  const rootRouter = express.Router();

  function setupRoutes() {
    api.use('/', rootRouter);
    api.use('/admin', AdminRouter(pushRequest));
    api.use('/auth', AuthRouter(pushRequest));
    api.use('/discord', DiscordRouter(pushRequest));

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
    provider.getService('taskManager').addApiRequest({
      id: `API:${req.originalUrl}@${Date.now()}`,
      execute,
    });
  }

  // Setup server and listen for connections
  setupMiddleware();
  setupRoutes();
  server.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });

  return { api, server };
}

export default API;
