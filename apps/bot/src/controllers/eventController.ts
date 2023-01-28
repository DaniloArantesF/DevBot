import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { Controller, DiscordEvent, EventTask, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';

class EventController implements Controller<QueueTaskData, EventTask> {
  queue = new Queue<QueueTaskData>('event-queue', queueSettings);
  taskMap = new Map<string, EventTask>();

  constructor() {}

  async addTask(event: DiscordEvent, args: any[] = []) {
    const job = this.queue.createJob({ id: `${Date.now()}${event.name}` });
    await job.timeout(2000).retries(2).save();
    this.taskMap.set(job.id, { ...event, args });
    return job;
  }

  async processTasks() {
    this.queue.process(async (job) => {
      const event = this.taskMap.get(job.id);
      if (!event) return;

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

export default EventController;
