import Queue from 'bee-queue';
import type { BotProvider } from '@/utils/types';
import { AUTO_PROCESS, REDIS_HOSTNAME, REDIS_PORT } from '@/utils/config';
import ApiController from '@/controllers/apiController';
import CommandController from '@/controllers/commandController';
import EventController from '@/controllers/eventController';
import Twitter from '@/controllers/services/twitter';
import HabitTracker from '@/controllers/plugins/habitTracker';
import OpenAI from './controllers/plugins/openai/openai';

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
  const apiController = new ApiController();
  const commandController = new CommandController();
  const eventController = new EventController();
  const twitterController = new Twitter();
  const openAIController = new OpenAI();
  const habitTrackerController = new HabitTracker(provider);

  // Process tasks as soon as dependencies are ready
  // Call plugin setup tasks
  provider.getService('discordClient').on('ready',async () => {
    if (AUTO_PROCESS) (await initProcessing())!! && console.log('Processing tasks...');
    habitTrackerController.setup();
  });

  // Process tasks
  async function initProcessing() {
    const discordClient = provider.getDiscordClient();
    await apiController.processTasks(discordClient);
    await commandController.processTasks(discordClient.commands);
    await eventController.processTasks();
  }

  return {
    apiController,
    commandController,
    eventController,
    openAIController,
    twitterController,
    habitTrackerController,
  };
}

export default TaskManager;
