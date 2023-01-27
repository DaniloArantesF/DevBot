import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { Controller, DiscordCommand, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';
import { ChatInputCommandInteraction } from 'discord.js';

class CommandController implements Controller<QueueTaskData, ChatInputCommandInteraction> {
  queue: Queue<QueueTaskData>;
  taskMap: Map<string, ChatInputCommandInteraction>;

  constructor() {
    this.queue = new Queue<QueueTaskData>('command-queue', queueSettings);
    this.taskMap = new Map<string, ChatInputCommandInteraction>();
  }
  async addTask(interaction: ChatInputCommandInteraction) {
    const job = this.queue.createJob({ id: interaction.id });
    await job.timeout(2000).retries(2).save();
    this.taskMap.set(job.id, interaction);
    return job;
  }

  async processTasks(commands: Map<string, DiscordCommand>) {
    this.queue.process(async (job) => {
      const interaction = this.taskMap.get(job.id);
      if (!interaction) return;

      const command = commands.get(interaction.commandName);
      if (!command) return;

      const data = await command.execute(interaction);
      if (data) {
        job.data.result = stringifyCircular(data);
      }

      this.taskMap.delete(job.id);
      return job.data;
    });
  }

  async removeTask(id: string) {
    const job = await this.queue.getJob(id);
    await job.remove();
    this.taskMap.delete(id);
  }
}

export default CommandController;
