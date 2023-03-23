import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import AdminRouter from '@/api/adminRouter';
import { ENVIRONMENT, API_PORT } from '@config';
import AuthRouter from '@/api/authRouter';
import DiscordRouter from '@/api/discordRouter';
import BotRouter from '@/api/botRouter';
import PluginRouter from './pluginRouter';
import { logger } from 'shared/logger';
import cookie from 'cookie-parser';

class Api {
  api = express();
  server = http.createServer(this.api);
  rootRouter = express.Router();
  routers = {
    '/': this.rootRouter,
    '/bot': BotRouter.router,
    '/admin': AdminRouter.router,
    '/auth': AuthRouter.router,
    '/discord': DiscordRouter.router,
    '/plugins': PluginRouter.router,
  };

  constructor() {
    for (const [path, router] of Object.entries(this.routers)) {
      this.api.use(path, router);
    }
  }

  async start() {
    this.server.listen(API_PORT, () => {
      logger.Info('API', `Listening on port ${API_PORT}`);
    });
  }

  setupMiddleware() {
    this.api.use(cors());
    this.api.options(
      '*',
      cors({
        origin: ['http://localhost:3000', 'https://darflix.dev'],
        methods: ['GET', 'POST'],
        credentials: true,
      }),
    );
    this.api.use(express.urlencoded({ extended: true }));
    this.api.use(express.json());
    this.api.use(cookie());
    this.api.use(morgan(ENVIRONMENT === 'dev' ? 'dev' : 'combined'));

    // Rate limit requests - 10/sec
    this.api.use(
      rateLimit({
        windowMs: 1000,
        max: 10,
        message: 'Too many requests',
        headers: true,
      }),
    );
  }
}

const api = new Api();
export default api;
