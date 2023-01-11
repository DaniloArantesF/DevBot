import express from 'express';
import http from 'http';
import cors from 'cors';
import adminRouter from './adminRouter';
import { CLIENT_URL, PORT } from '@config';

function API() {
  const api = express();
  const server = http.createServer(api);

  function setupRoutes() {
    api.use('/admin', adminRouter());
  }

  function setupMiddleware() {
    api.use(express.urlencoded({ extended: true }));
    api.use(express.json());
    api.use(cors());
    api.options(
      "*",
      cors({
        origin: ["*"],//[CLIENT_URL],
        methods: ["GET", "POST"],
      })
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