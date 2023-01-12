import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import AdminRouter from './adminRouter';
import { CLIENT_URL, PORT } from '@config';
import AuthRouter from './authRouter';
import DiscordRouter from './discordRouter';

// TODO:
/**
 * YoutubeAPI
 * TwitchAPI
 */

function API() {
  const api = express();
  const server = http.createServer(api);
  const rootRouter = express.Router();

  function setupRoutes() {
    api.use('/', rootRouter);
    api.use('/admin', AdminRouter());
    api.use('/auth', AuthRouter());
    api.use('/discord', DiscordRouter());

    // Status route, does not go through task manager
    rootRouter.get(
      '/status',
      async (req: Request, res: Response) => res.send('Online'),
    );
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
