import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { Controller, DiscordEvent, EventTask, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';
import { logger } from 'shared/logger';

class EventController implements Controller<QueueTaskData, EventTask> {
  queue!: Queue<QueueTaskData>;
  taskMap = new Map<string, EventTask>();
  config = {
    taskTimeout: 3000,
    taskRetries: 2,
  };

  constructor() {}

  init() {
    this.queue = new Queue<QueueTaskData>('event-queue', queueSettings);
  }

  async addTask(event: DiscordEvent, args: any[] = []) {
    if (!this.queue) {
      logger.Error('EventController', 'Queue not initialized!');
      console.error(event.name);
      return null;
    }
    const job = this.queue.createJob({ id: `${event.name}@${new Date().toISOString()}` });
    await job.timeout(this.config.taskTimeout).retries(this.config.taskRetries).save();
    this.taskMap.set(job.id, { ...event, args });
    return job;
  }

  async processTasks() {
    logger.Info('EventController', 'Processing tasks ...');
    this.queue.process(async (job) => {
      const event = this.taskMap.get(job.id);
      if (!event || !event.on) return;

      const data = await event.on(...event.args);
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

const eventController = new EventController();
export default eventController;
