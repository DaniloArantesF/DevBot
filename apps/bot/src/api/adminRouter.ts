import { Router, Request, Response } from "express";
import taskManager from "../TaskManager";

const { addApiRequest } = taskManager;

function AdminRouter() {
  const router = Router();

  router.get("/", async (req: Request, res: Response) => {
    async function handler() {
      res.send('admin')
    }

    await addApiRequest({ id: req.rawHeaders.toString(), execute: handler });
  });

  router.post('/register-commands', async (req: Request, res: Response) => {
    async function handler() {
      const guildId = req.body?.guildId;
      res.send('todo')
    }

    await addApiRequest({ id: req.rawHeaders.toString(), execute: handler });
  });

  return router;
}

export default AdminRouter;