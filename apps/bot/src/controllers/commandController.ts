import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { TBot, IController, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';
import {
  ChatInputCommandInteraction,
  Message,
  MessageComponentInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js';
import { BOT_CONFIG } from 'shared/config';
import { logger } from 'shared/logger';
import bot from '@/index';
import discordClient from '@/DiscordClient';

const COOLDOWN_MS = BOT_CONFIG.cooldownMs;
const PREFIX = BOT_CONFIG.prefix;

export type CommandInteraction =
  | ChatInputCommandInteraction
  | Message
  | MessageComponentInteraction
  | ContextMenuCommandInteraction;

class CommandController implements IController<QueueTaskData, CommandInteraction> {
  queue!: Queue<QueueTaskData>;
  taskMap = new Map<string, CommandInteraction>();
  config = {
    taskTimeout: 5000,
    taskRetries: 1,
  };

  constructor() {}

  init() {
    this.queue = new Queue<QueueTaskData>('command-queue', queueSettings);
  }

  async addTask(interaction: CommandInteraction) {
    const job = this.queue.createJob(interaction.id);

    job.timeout(this.config.taskTimeout).retries(this.config.taskRetries);

    // Check if user is in cooldown
    if (interaction.member) {
      const cooldownMap = bot.userCooldown;
      const lastInteraction = cooldownMap.get(interaction.member!.user.id) ?? -1;
      const timeLeft = lastInteraction === -1 ? 0 : lastInteraction + COOLDOWN_MS - Date.now();

      if (timeLeft > 0) {
        logger.Info(
          'CommandController',
          `Delaying command from ${interaction.member!.user.username} for ${timeLeft}ms`,
        );
        job.delayUntil(Date.now() + timeLeft);
      }

      // Update last interaction
      cooldownMap.set(interaction.member!.user.id, Date.now());
    }

    await job.save();
    this.taskMap.set(job.id, interaction);
    return job;
  }

  async processTasks() {
    const commands = discordClient.commands;
    logger.Info('CommandController', 'Processing tasks ...');
    this.queue.process(async (job) => {
      const interaction = this.taskMap.get(job.id);
      if (!interaction) return;

      let command: TBot.Command | undefined;
      let execute: TBot.CommandHandler | undefined;

      if (interaction instanceof Message) {
        const commandToken = interaction.content
          .split(' ')[0]
          .slice(PREFIX.length, interaction.content.length);

        // Find command
        command = commands.get(commandToken);
        if (!command) {
          // Check aliases
          command = [...commands.values()].find((c) => c.aliases?.includes(commandToken));
        }
        execute = command?.messageHandler;
      } else if (interaction.isButton() || interaction.isMessageComponent()) {
        const commandToken = interaction.customId.split(':')[0];
        command = commands.get(commandToken);
        execute = command?.buttonHandler;
      } else {
        command = commands.get(interaction.commandName);
        execute = command?.execute;
      }

      if (!command || !execute) return;

      let data;

      try {
        data = await execute(interaction as any); //??
      } catch (error) {
        console.log(error);
        data = error;
      }

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

const commandController = new CommandController();
export default commandController;
