import Queue from 'bee-queue';
import type { BotProvider } from '@/utils/types';
import { AUTO_PROCESS } from '@/utils/config';
import ApiController from '@/controllers/apiController';
import CommandController from '@/controllers/commandController';
import EventController from '@/controllers/eventController';
import Twitter from '@/controllers/services/twitter';

export const queueSettings: Queue.QueueSettings = {
  prefix: 'bot',
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

  // Process tasks as soon as dependencies are ready
  provider.getService('discordClient').on('ready', () => {
    if (AUTO_PROCESS) initProcessing() && console.log('Processing tasks...');
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
    twitterController,
  };
}

export default TaskManager;
