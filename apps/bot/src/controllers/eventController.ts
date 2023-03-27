import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { Controller, DiscordEvent, EventTask, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';
import { logger } from 'shared/logger';

type EventCallback<T> = (args: T) => void;

class EventBus {
  private listeners: Record<string, Function[]> = {};

  on<T>(event: string /* Discord.ClientEvents */, callback: EventCallback<T>) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: EventCallback<any>) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  emit<T>(event: string, ...args: T[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((cb) => cb(...args));
  }
}

class EventController implements Controller<QueueTaskData, EventTask> {
  queue!: Queue<QueueTaskData>;
  taskMap = new Map<string, EventTask>();
  config = {
    taskTimeout: 3000,
    taskRetries: 2,
  };
  eventBus = new EventBus();

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

      // Execute main event handler
      const data = await event.on(...event.args);

      // Emit event to the event bus
      this.eventBus.emit(event.name, ...event.args);

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
