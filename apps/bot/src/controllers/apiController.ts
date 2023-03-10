import DiscordClient from '@/DiscordClient';
import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { ApiTask, Controller, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';
import { logger } from 'shared/logger';

class ApiController implements Controller<QueueTaskData, ApiTask['execute']> {
  queue = new Queue<QueueTaskData>('api-queue', queueSettings);
  taskMap = new Map<string, ApiTask['execute']>();
  config = {
    taskTimeout: 2000,
    taskRetries: 2,
  };

  constructor() {}

  async addTask({ id, execute }: ApiTask) {
    const job = this.queue.createJob({ id });
    await job.timeout(this.config.taskTimeout).retries(this.config.taskRetries).save();
    this.taskMap.set(job.id, execute);
    return job;
  }

  async processTasks(client: DiscordClient) {
    logger.Info('APIController', 'Processing API tasks.');
    this.queue.process(async (job) => {
      const handler = this.taskMap.get(job.id);
      if (!handler) return;

      const data = await handler(client);
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

export default ApiController;
