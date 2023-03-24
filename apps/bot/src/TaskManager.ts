import Queue from 'bee-queue';
import type { Controller } from '@/utils/types';
import { REDIS_HOSTNAME, REDIS_PORT } from '@/utils/config';
import apiController from '@/controllers/apiController';
import commandController from '@/controllers/commandController';
import eventController from '@/controllers/eventController';
import habitTrackerPlugin from '@/controllers/plugins/habitTracker';
import openAIPlugin from './controllers/plugins/openai/openai';
import { logger } from 'shared/logger';

export const queueSettings: Queue.QueueSettings = {
  prefix: 'bot',
  activateDelayedJobs: true,
  stallInterval: 15000,
  delayedDebounce: 2000,
  redis: {
    host: REDIS_HOSTNAME,
    port: REDIS_PORT,
    db: 0,
    options: {},
  },
};

class TaskManager {
  // TODO: add typing to this
  controllers: Controller<any, any>[]
  plugins: any[]

  constructor() {
    logger.Info('TaskManager', 'Initializing ...');
    this.controllers = [apiController, commandController, eventController];
    this.plugins= [openAIPlugin, habitTrackerPlugin];

  }

  // Process tasks
  async initProcessing() {
    await apiController.processTasks();
    await commandController.processTasks();
    await eventController.processTasks();
  }

  async setupTaskControllers() {
    logger.Info('TaskManager', 'Setting up controllers ...');
    apiController.init();
    commandController.init();
    eventController.init();
  }

  async setupPlugins() {
    logger.Info('TaskManager', 'Initializing plugins...');
    await openAIPlugin.init();
    habitTrackerPlugin.init();
  }

  async shutdown() {
    for (const controller of [...this.controllers, ...this.plugins]) {
      await controller.queue.close();
    }
  }
}

const taskManager = new TaskManager();
export default taskManager;
