import Queue from 'bee-queue';
import { ChatInputCommandInteraction } from 'discord.js';
import { Command } from './commands';

type apiHandler = () => Promise<void> | void;

interface ApiTask {
  id: string;
  execute: apiHandler;
}

// TODO: Improve error handling
// TODO: Add cooldowns using .delayUntil ?

/**
 * Manages task execution
 */
function TaskManager() {
  // Command interactions
  const commandQueue = new Queue('command-queue', {});
  // Maps job ids to interactions
  const commandsMap = new Map<string, ChatInputCommandInteraction>();

  // Api tasks
  const apiQueue = new Queue('api-queue', {});
  // Maps job ids to api handlers
  const requestMap = new Map<string, ApiTask['execute']>();

  async function addCommandInteraction(interaction: ChatInputCommandInteraction) {
    // Add job id to interaction queue, save original interaction in map
    const job = commandQueue.createJob({ id: interaction.id });
    await job.timeout(2000).retries(2).save();

    commandsMap.set(job.id, interaction);

    job.on('failed', (err) => {
      console.log(err);
    });
    job.on('succeeded', () => console.log(`${job.id} (${interaction.commandName}) succeeded`));

    return job;
  }

  // Processes interactions from the interaction queue
  function processCommands(commands: Map<string, Command>) {
    commandQueue.process(async (job) => {
      const interaction = commandsMap.get(job.id);
      if (!interaction) return;

      const command = commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
    });
  }

  function processApiRequests() {
    apiQueue.process(async (job) => {
      const handler = requestMap.get(job.id);
      if (!handler) return;

      return await handler();
    });
  }

  async function addApiRequest({ id, execute }: ApiTask) {
    const job = apiQueue.createJob({ id });
    await job.timeout(2000).retries(2).save();

    requestMap.set(job.id, execute);

    job.on('failed', (err) => {
      console.log(err);
    });
    job.on('succeeded', () => console.log(`${job.id} (${id}) succeeded`));

    return job;
  }

  //  Removes a task from its queue
  async function removeTask<T>(job: Queue.Job<T>) {
    // TODO: Make sure job is not currently being processed before calling this
    return await job.remove();
  }

  return {
    addApiRequest,
    addCommandInteraction,
    processApiRequests,
    processCommands,
    removeTask,
  };
}

const taskManager = TaskManager();
export default taskManager;
