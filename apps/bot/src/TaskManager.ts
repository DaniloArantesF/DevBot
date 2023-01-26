import Queue from 'bee-queue';
import { ChatInputCommandInteraction } from 'discord.js';
import type DiscordClient from './DiscordClient';
import type {
  ApiTask,
  BotProvider,
  QueueTaskData,
  DiscordCommand,
  DiscordEvent,
  EventTask,
} from '@utils/types';
import { AUTO_PROCESS } from '@utils/config';
import { stringifyCircular } from './utils';

const DEBUG = false;
const queueSettings: Queue.QueueSettings = {
  prefix: 'bot',
};

/**
 * Task execution module
 * Depends on discordClient service to start processing tasks
 *
 * @param {BotProvider} provider
 */
function TaskManager(provider: BotProvider) {
  // Command tasks
  const commandQueue = new Queue<QueueTaskData>('command-queue', queueSettings);
  const commandMap = new Map<string, ChatInputCommandInteraction>();

  // Api tasks
  const apiQueue = new Queue<QueueTaskData>('api-queue', queueSettings);
  const requestMap = new Map<string, ApiTask['execute']>();

  // Event tasks
  const eventQueue = new Queue<QueueTaskData>('event-queue', queueSettings);
  const eventMap = new Map<string, EventTask>();

  // Process tasks as soon as dependencies are ready
  provider.getService('discordClient').on('ready', () => {
    if (AUTO_PROCESS) initProcessing() && console.log('Processing tasks...');
  });

  // Process tasks
  async function initProcessing() {
    processCommands(provider.getService('discordClient').commands);
    processApiRequests(provider.getService('discordClient'));
    processEvents();
  }

  async function addEvent(event: DiscordEvent, args: any[] = []) {
    const job = eventQueue.createJob({ id: `${Date.now()}${event.name}` });
    await job.timeout(2000).retries(2).save();
    eventMap.set(job.id, { ...event, args });

    job.on('failed', (err) => {
      console.log(err);
    });
    job.on('succeeded', () => {
      if (DEBUG) {
        console.log(`${job.id} (${event.name}) succeeded`);
      }
    });

    return job;
  }

  async function processEvents() {
    eventQueue.process(async (job) => {
      const event = eventMap.get(job.id);
      if (!event) return;
      const data = await event.on(...event.args);

      if (data) {
        // Save result to redis
        job.data.result = stringifyCircular(data);
      }

      eventMap.delete(job.id);
      return job.data;
    });
  }

  // Adds a task to the command queue
  async function addCommandInteraction(interaction: ChatInputCommandInteraction) {
    const job = commandQueue.createJob({ id: interaction.id });
    await job.timeout(2000).retries(2).save();

    commandMap.set(job.id, interaction); // save interaction

    job.on('failed', (err) => {
      console.log(err);
    });
    job.on('succeeded', () => {
      if (DEBUG) {
        console.log(`${job.id} (${interaction.commandName}) succeeded`);
      }
    });

    return job;
  }

  // Executes interaction tasks from the queue
  function processCommands(commands: Map<string, DiscordCommand>) {
    commandQueue.process(async (job) => {
      const interaction = commandMap.get(job.id);
      if (!interaction) return;

      const command = commands.get(interaction.commandName);
      if (!command) return;

      const data = await command.execute(interaction);
      if (data) {
        // Save result to redis
        job.data.result = stringifyCircular(data);
      }

      commandMap.delete(job.id);
      return job.data;
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
    job.on('succeeded', () => {
      if (DEBUG) {
        console.log(`${job.id} (${id}) succeeded`);
      }
    });

    return job;
  }

  // Executes api tasks from the queue
  function processApiRequests(client: DiscordClient) {
    apiQueue.process(async (job) => {
      const handler = requestMap.get(job.id);
      if (!handler) return;

      const data = await handler(client);
      requestMap.delete(job.id);

      if (data) {
        // Save result to redis
        job.data.result = stringifyCircular(data);
      }
      return job.data;
    });
  }

  //  Removes a task from its queue
  async function removeTask<T>(job: Queue.Job<T>) {
    // TODO: Make sure job is not currently being processed before calling this
    return await job.remove();
  }

  return {
    initProcessing,
    addEvent,
    processEvents,
    addApiRequest,
    addCommandInteraction,
    processApiRequests,
    processCommands,
    removeTask,
  };
}

export default TaskManager;
