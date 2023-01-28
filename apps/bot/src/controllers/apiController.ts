import DiscordClient from '@/DiscordClient';
import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { ApiTask, Controller, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';

class ApiController implements Controller<QueueTaskData, ApiTask['execute']> {
  queue = new Queue<QueueTaskData>('api-queue', queueSettings);
  taskMap = new Map<string, ApiTask['execute']>();

  constructor() {}

  async addTask({ id, execute }: ApiTask) {
    const job = this.queue.createJob({ id });
    await job.timeout(2000).retries(2).save();
    this.taskMap.set(job.id, execute);
    return job;
  }

  async processTasks(client: DiscordClient) {
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
