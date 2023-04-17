import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { IController, DiscordEvent, EventTask, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';
import { logger } from 'shared/logger';

type EventCallback<T> = (...args: any[]) => void;
class EventBus {
  private listeners: Record<string, Function[]> = {};
  private internalTaskListeners: Record<string, Record<string, Function | null>> = {};

  // Defines an internal task
  task(event: string, key: string, callback: EventCallback<any[]>) {
    // logger.Debug('EventBus', `Added internal event hook:\n\t${event}:${key}`);
    this.on(event, callback, true, key);
  }

  on<T>(event: string, callback: EventCallback<T>, internalTask = false, internalKey = '') {
    if (internalTask && internalKey) {
      if (!this.internalTaskListeners[event]) this.internalTaskListeners[event] = {};
      this.internalTaskListeners[event][internalKey] = callback;
    } else {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }
  }

  off(event: string, callback: EventCallback<any>, internal = false, key = '') {
    if (internal && this.internalTaskListeners[event] && key) {
      this.internalTaskListeners[event][key] = null;
    } else {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  emit<T>(event: string, ...args: T[]) {
    if (this.internalTaskListeners[event]) {
      for (const callback of Object.values(this.internalTaskListeners[event])) {
        callback?.(...args);
      }
    }
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(...args));
    }
  }
}

class EventController implements IController<QueueTaskData, EventTask> {
  queue!: Queue<QueueTaskData>;
  taskMap = new Map<string, EventTask>();
  config = {
    taskTimeout: 5000,
    taskRetries: 1,
  };
  eventBus = new EventBus();

  init() {
    this.queue = new Queue<QueueTaskData>('event-queue', queueSettings);
  }

  async addTask(event: DiscordEvent, args: any) {
    if (!this.queue) {
      logger.Error('EventController', 'Queue not initialized!');
      console.log(...args);
      return null;
    }
    const job = this.queue.createJob<string>(`${event.name}@${Date.now()}`);
    await job.timeout(this.config.taskTimeout).retries(this.config.taskRetries).save();
    this.taskMap.set(job.id, { ...event, args });

    job.on('failed', () => {
      logger.Error('EventController', `Failed to process task ${job.id}`);
    });

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
        job.data = stringifyCircular(data);
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
