import Queue from 'bee-queue';
import type { BotProvider } from '@/utils/types';
import { REDIS_HOSTNAME, REDIS_PORT } from '@/utils/config';
import ApiController from '@/controllers/apiController';
import CommandController from '@/controllers/commandController';
import EventController from '@/controllers/eventController';
import HabitTracker from '@/controllers/plugins/habitTracker';
import OpenAI from './controllers/plugins/openai/openai';
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

/**
 * Task execution module
 * Depends on discordClient service to start processing tasks
 *
 * @param {BotProvider} provider
 */
function TaskManager(provider: BotProvider) {
  logger.Info('TaskManager', 'Initializing ...');

  // Task controllers
  const apiController = new ApiController();
  const commandController = new CommandController();
  const eventController = new EventController();

  // Plugins
  const openAIController = new OpenAI();
  const habitTrackerController = new HabitTracker(provider);

  const controllers = [apiController, commandController, eventController];

  const plugins = [openAIController, habitTrackerController];

  // Process tasks
  async function initProcessing() {
    const discordClient = provider.getDiscordClient();
    await apiController.processTasks(discordClient);
    await commandController.processTasks(discordClient.commands);
    await eventController.processTasks();
  }

  async function setupPlugins() {
    await openAIController.setup();
    await habitTrackerController.setup();
  }

  async function shutdown() {
    for (const controller of [...controllers, ...plugins]) {
      await controller.queue.close();
    }
  }

  return {
    apiController,
    commandController,
    eventController,
    openAIController,
    habitTrackerController,
    initProcessing,
    setupPlugins,
    controllers,
    plugins,
    shutdown,
  };
}

export default TaskManager;
