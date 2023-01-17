import Queue from 'bee-queue';
import { ChatInputCommandInteraction } from 'discord.js';
import type DiscordClient from './DiscordClient';
import type { ApiTask, BotProvider, QueueTaskData, DiscordCommand } from '@utils/types';
import { AUTO_PROCESS } from '@utils/config';

/**
 * Manages task execution
 * Depends on discordClient service to start processing tasks
 */
function TaskManager(provider: BotProvider) {
  // Command tasks
  const commandQueue = new Queue<QueueTaskData>('command-queue', {});
  const commandsMap = new Map<string, ChatInputCommandInteraction>();

  // Api tasks
  const apiQueue = new Queue<QueueTaskData>('api-queue', {});
  const requestMap = new Map<string, ApiTask['execute']>();

  // Process tasks as soon as dependencies are ready
  provider.getService('discordClient').on('ready', () => {
    if (AUTO_PROCESS) initProcessing() && console.log('Processing tasks...');
  });

  // Process tasks
  async function initProcessing() {
    processCommands(provider.getService('discordClient').commands);
    processApiRequests(provider.getService('discordClient'));
  }

  // Adds a task to the command queue
  async function addCommandInteraction(interaction: ChatInputCommandInteraction) {
    const job = commandQueue.createJob({ id: interaction.id });
    await job.timeout(2000).retries(2).save();

    commandsMap.set(job.id, interaction); // save interaction

    job.on('failed', (err) => {
      console.log(err);
    });
    job.on('succeeded', () => console.log(`${job.id} (${interaction.commandName}) succeeded`));

    return job;
  }

  // Execute interaction tasks from the queue
  function processCommands(commands: Map<string, DiscordCommand>) {
    commandQueue.process(async (job) => {
      const interaction = commandsMap.get(job.id);
      if (!interaction) return;

      const command = commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);

      // TODO: update job data properly
      commandsMap.delete(job.id);
    });
  }

  // Adds a task to the api queue
  async function addApiRequest({ id, execute }: ApiTask) {
    const job = apiQueue.createJob({ id });
    await job.timeout(2000).retries(2).save();
    requestMap.set(job.id, execute); // save request

    job.on('failed', (err) => {
      console.log(err);
    });
    job.on('succeeded', () => console.log(`${job.id} (${id}) succeeded`));

    return job;
  }

  // Execute api tasks from the queue
  function processApiRequests(client: DiscordClient) {
    apiQueue.process(async (job) => {
      const handler = requestMap.get(job.id);
      if (!handler) return;
      await handler(client);
      requestMap.delete(job.id);
    });
  }

  //  Removes a task from its queue
  async function removeTask<T>(job: Queue.Job<T>) {
    // TODO: Make sure job is not currently being processed before calling this
    return await job.remove();
  }

  return {
    initProcessing,
    addApiRequest,
    addCommandInteraction,
    processApiRequests,
    processCommands,
    removeTask,
  };
}

export default TaskManager;
